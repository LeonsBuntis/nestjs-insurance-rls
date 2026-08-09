import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { DataSource, EntityManager } from 'typeorm';
import { Principal } from '../auth/principal.interface';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// policy_types are lowercase alpha enum values, e.g. "health", "auto"
const SAFE_TOKEN_RE = /^[a-z][a-z0-9_]*$/i;

function toPostgresArray(values: string[]): string {
  return `{${values.join(',')}}`;
}

type RlsRequest = {
  principal?: Principal;
  entityManager?: EntityManager;
};

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<RlsRequest>();

    const principal = request.principal;
    if (!principal) {
      return next.handle();
    }

    const customers = (principal.customers ?? []).filter((v) =>
      UUID_RE.test(v),
    );
    const policyTypes = (principal.policy_types ?? []).filter((v) =>
      SAFE_TOKEN_RE.test(v),
    );

    const queryRunner = this.dataSource.createQueryRunner();

    return new Observable((subscriber) => {
      const setup = async () => {
        await queryRunner.connect();
        await queryRunner.startTransaction();
        await queryRunner.query(
          `SET LOCAL app.customers = '${toPostgresArray(customers)}'`,
        );
        await queryRunner.query(
          `SET LOCAL app.policy_types = '${toPostgresArray(policyTypes)}'`,
        );
        request.entityManager = queryRunner.manager;
      };

      setup()
        .then(() => {
          next.handle().subscribe({
            next: (v) => subscriber.next(v),
            error: async (err) => {
              try {
                await queryRunner.rollbackTransaction();
              } finally {
                await queryRunner.release();
              }
              subscriber.error(err);
            },
            complete: async () => {
              try {
                await queryRunner.commitTransaction();
              } catch (err) {
                try {
                  await queryRunner.rollbackTransaction();
                } finally {
                  await queryRunner.release();
                }
                subscriber.error(err);
                return;
              }
              await queryRunner.release();
              subscriber.complete();
            },
          });
        })
        .catch(async (err) => {
          await queryRunner.release();
          subscriber.error(err);
        });
    });
  }
}
