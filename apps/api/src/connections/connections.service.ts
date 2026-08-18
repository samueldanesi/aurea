import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../common/db/db.service';
import { EngineClientService } from '../common/engine/engine-client.service';

interface CreateConnectionDto {
  name: string;
  connectorType: string;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  syncSchedule?: string;
}

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly db: DbService,
    private readonly engine: EngineClientService,
  ) {}

  list(tenantId: string) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `SELECT id, tenant_id, name, connector_type, config, sync_schedule, is_active, created_at
         FROM app.data_connections ORDER BY created_at DESC`,
      );
      return res.rows;
    });
  }

  async create(tenantId: string, dto: CreateConnectionDto) {
    // Credentials never touch this service's DB: they go straight to the engine's
    // vault, which returns an opaque reference we store instead.
    const secretRef = await this.engine.storeSecret(tenantId, dto.credentials);

    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO app.data_connections
           (tenant_id, name, connector_type, config, secret_ref, sync_schedule)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, connector_type, config, sync_schedule, is_active, created_at`,
        [tenantId, dto.name, dto.connectorType, JSON.stringify(dto.config), secretRef, dto.syncSchedule ?? null],
      );
      return res.rows[0];
    });
  }

  async triggerSync(tenantId: string, connectionId: string) {
    const exists = await this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        'SELECT id FROM app.data_connections WHERE id = $1',
        [connectionId],
      );
      return (res.rowCount ?? 0) > 0;
    });
    if (!exists) throw new NotFoundException('Connection not found');
    return this.engine.triggerSync(tenantId, connectionId);
  }

  syncLogs(tenantId: string, connectionId: string) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `SELECT * FROM app.sync_logs WHERE connection_id = $1 ORDER BY started_at DESC LIMIT 50`,
        [connectionId],
      );
      return res.rows;
    });
  }
}
