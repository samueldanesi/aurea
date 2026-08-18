import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db/db.service';

interface CreateAlertDto {
  name: string;
  kpiKey: string;
  condition: { type: 'threshold' | 'anomaly'; op?: '<' | '>' | '<=' | '>=' | '=='; value?: number };
  channels?: string[];
  recipients?: string[];
}

@Injectable()
export class AlertsService {
  constructor(private readonly db: DbService) {}

  list(tenantId: string) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query('SELECT * FROM app.alerts ORDER BY created_at DESC');
      return res.rows;
    });
  }

  create(tenantId: string, dto: CreateAlertDto) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO app.alerts (tenant_id, name, kpi_key, condition, channels, recipients)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          tenantId,
          dto.name,
          dto.kpiKey,
          JSON.stringify(dto.condition),
          JSON.stringify(dto.channels ?? ['email']),
          JSON.stringify(dto.recipients ?? []),
        ],
      );
      return res.rows[0];
    });
  }

  events(tenantId: string, alertId: string) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        'SELECT * FROM app.alert_events WHERE alert_id = $1 ORDER BY sent_at DESC LIMIT 100',
        [alertId],
      );
      return res.rows;
    });
  }
}
