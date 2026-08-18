import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DbService } from '../db/db.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Logs every mutating request per-tenant for compliance/audit trail (GDPR "who did what"). */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly db: DbService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (!MUTATING_METHODS.has(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const user = request.user;
        if (!user) return;
        this.db
          .withTenant(user.tenantId, (client) =>
            client.query(
              `INSERT INTO app.audit_log (tenant_id, user_id, action, entity, metadata)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                user.tenantId,
                user.userId,
                `${request.method} ${request.route?.path ?? request.url}`,
                request.route?.path?.split('/')[1] ?? null,
                JSON.stringify({ params: request.params, query: request.query }),
              ],
            ),
          )
          .catch(() => {
            // Audit logging must never break the primary request; a failure here is
            // surfaced via app logs/monitoring instead of bubbling up to the client.
          });
      }),
    );
  }
}
