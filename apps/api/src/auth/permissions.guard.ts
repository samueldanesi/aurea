import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DbService } from '../common/db/db.service';
import { PERMISSIONS_KEY } from './permissions.decorator';
import type { AuthenticatedUser } from './jwt.strategy';

/**
 * Roles/permissions are stored per-tenant (app.roles.permissions), not hardcoded,
 * so each tenant admin can define their own roles (e.g. "agent" that only sees
 * their own customers) without a code change. Checked per-request rather than
 * baked into the JWT so a permission revoked mid-session takes effect immediately.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: DbService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    const granted = await this.db.withTenant(user.tenantId, async (client) => {
      const res = await client.query(
        `SELECT DISTINCT jsonb_array_elements_text(r.permissions) AS permission
         FROM app.user_roles ur
         JOIN app.roles r ON r.id = ur.role_id
         WHERE ur.user_id = $1`,
        [user.userId],
      );
      return new Set<string>(res.rows.map((r) => r.permission));
    });

    const hasAll = required.every((p) => granted.has(p) || granted.has('*'));
    if (!hasAll) {
      throw new ForbiddenException('Missing required permission');
    }
    return true;
  }
}
