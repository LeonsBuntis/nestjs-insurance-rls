import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class RlsSetupService implements OnModuleInit {
  private readonly logger = new Logger(RlsSetupService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.dataSource.query(`
      ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
      ALTER TABLE policies FORCE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS principal_scope ON policies;
      CREATE POLICY principal_scope ON policies
        FOR SELECT
        USING (
          customer_id = ANY(current_setting('app.customers', true)::uuid[])
          AND type::text = ANY(current_setting('app.policy_types', true)::text[])
        );

      -- Without permissive DML policies, RLS would silently block all INSERT /
      -- UPDATE / DELETE from app_user. Access control for writes is enforced at
      -- the service layer; issue #4 will narrow this further per-request.
      DROP POLICY IF EXISTS allow_insert ON policies;
      CREATE POLICY allow_insert ON policies FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS allow_update ON policies;
      CREATE POLICY allow_update ON policies
        FOR UPDATE USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS allow_delete ON policies;
      CREATE POLICY allow_delete ON policies FOR DELETE USING (true);
    `);

    this.logger.log('RLS principal_scope policy installed on policies table');
  }
}
