import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Gates the operator-only endpoints used to onboard new client tenants (task 8 in the
 * product spec: central admin panel). MVP: a static key from env, checked against an
 * `x-platform-admin-key` header. Swap for real staff SSO before this is exposed beyond
 * you/your team.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-platform-admin-key'];
    const expected = this.config.get<string>('PLATFORM_ADMIN_KEY');
    if (!expected || key !== expected) {
      throw new UnauthorizedException('Invalid platform admin key');
    }
    return true;
  }
}
