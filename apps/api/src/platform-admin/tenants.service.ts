import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db/db.service';

const DEFAULT_ROLES: Array<{ name: string; permissions: string[] }> = [
  {
    name: 'owner',
    permissions: [
      'dashboards:read', 'dashboards:write',
      'kpi:read', 'kpi:write',
      'connections:read', 'connections:write',
      'alerts:read', 'alerts:write',
      'ai:chat', 'users:manage',
    ],
  },
  { name: 'analyst', permissions: ['dashboards:read', 'dashboards:write', 'kpi:read', 'kpi:write', 'ai:chat'] },
  { name: 'viewer', permissions: ['dashboards:read', 'kpi:read', 'ai:chat'] },
];

/** Platform-operator side of onboarding: create a tenant + its default roles in one call. */
@Injectable()
export class TenantsService {
  constructor(private readonly db: DbService) {}

  list() {
    return this.db.withoutTenant(async (client) => {
      const res = await client.query('SELECT * FROM app.tenants ORDER BY created_at DESC');
      return res.rows;
    });
  }

  async create(name: string, slug: string, plan = 'trial') {
    return this.db.withoutTenant(async (client) => {
      const tenantRes = await client.query(
        `INSERT INTO app.tenants (name, slug, plan) VALUES ($1, $2, $3) RETURNING *`,
        [name, slug, plan],
      );
      const tenant = tenantRes.rows[0];

      for (const role of DEFAULT_ROLES) {
        await client.query(
          `INSERT INTO app.roles (tenant_id, name, permissions) VALUES ($1, $2, $3)`,
          [tenant.id, role.name, JSON.stringify(role.permissions)],
        );
      }
      return tenant;
    });
  }

  usage(tenantId: string) {
    // Placeholder aggregate for the operator "usage/cost per account" view from the spec
    // (section 8). Real implementation should pull AI token spend from apps/engine's
    // model-call log table and storage size from warehouse.raw_records, keyed by tenant.
    return this.db.withoutTenant(async (client) => {
      const [dashboards, connections, aiMessages] = await Promise.all([
        client.query('SELECT count(*) FROM app.dashboards WHERE tenant_id = $1', [tenantId]),
        client.query('SELECT count(*) FROM app.data_connections WHERE tenant_id = $1', [tenantId]),
        client.query('SELECT count(*) FROM app.ai_messages WHERE tenant_id = $1 AND role = $2', [tenantId, 'assistant']),
      ]);
      return {
        dashboards: Number(dashboards.rows[0].count),
        connections: Number(connections.rows[0].count),
        aiResponses: Number(aiMessages.rows[0].count),
      };
    });
  }
}
