import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: unknown, user: T, _info: unknown, context: ExecutionContext): T {
    if (err || !user) {
      throw (err as Error) || new UnauthorizedException();
    }
    context.switchToHttp().getRequest<Record<string, unknown>>().principal = user;
    return user;
  }
}
