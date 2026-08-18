import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '../common/db/db.service';
import { EngineClientService } from '../common/engine/engine-client.service';

// Only SELECT statements built from these tokens are allowed inside a KPI's sql_expression.
// This is a blunt guard, not a full SQL parser -- the real defense is that KPI definitions
// are only writable by users with kpi:write (typically tenant admins/analysts), and the
// resulting query still runs inside the tenant's RLS-scoped transaction.
const FORBIDDEN_SQL_PATTERN = /\b(insert|update|delete|drop|alter|grant|truncate|;)\b/i;

@Injectable()
export class KpiService {
  constructor(
    private readonly db: DbService,
    private readonly engine: EngineClientService,
  ) {}

  values(tenantId: string, kpiKey: string) {
    return this.engine.getKpiValues(tenantId, kpiKey);
  }

  list(tenantId: string) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `SELECT DISTINCT ON (key) * FROM app.kpi_definitions
         WHERE tenant_id = $1 ORDER BY key, version DESC`,
        [tenantId],
      );
      return res.rows;
    });
  }

  async create(
    tenantId: string,
    userId: string,
    dto: { key: string; label: string; description?: string; sqlExpression: string; unit?: string },
  ) {
    if (FORBIDDEN_SQL_PATTERN.test(dto.sqlExpression)) {
      throw new BadRequestException('KPI expression must be a single read-only SELECT');
    }
    return this.db.withTenant(tenantId, async (client) => {
      const versionRes = await client.query(
        `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
         FROM app.kpi_definitions WHERE tenant_id = $1 AND key = $2`,
        [tenantId, dto.key],
      );
      const nextVersion = versionRes.rows[0].next_version;
      const res = await client.query(
        `INSERT INTO app.kpi_definitions
           (tenant_id, key, label, description, sql_expression, unit, version, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          tenantId,
          dto.key,
          dto.label,
          dto.description ?? null,
          dto.sqlExpression,
          dto.unit ?? null,
          nextVersion,
          userId,
        ],
      );
      return res.rows[0];
    });
  }

  /** Full version history for a KPI -- lets an admin see/revert what changed and when. */
  history(tenantId: string, key: string) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM app.kpi_definitions
         WHERE tenant_id = $1 AND key = $2 ORDER BY version DESC`,
        [tenantId, key],
      );
      return res.rows;
    });
  }
}
