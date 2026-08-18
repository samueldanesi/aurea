import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DbService } from '../common/db/db.service';
import { EngineClientService } from '../common/engine/engine-client.service';

interface EmbedPayload {
  tenantId: string;
  dashboardId: string;
  scope: string;
}

@Injectable()
export class EmbedService {
  constructor(
    private readonly jwt: JwtService,
    private readonly db: DbService,
    private readonly engine: EngineClientService,
  ) {}

  async getEmbeddedDashboard(dashboardId: string, token: string) {
    let payload: EmbedPayload;
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Embed token invalid or expired');
    }
    if (payload.scope !== 'embed' || payload.dashboardId !== dashboardId) {
      throw new UnauthorizedException('Token not valid for this dashboard');
    }

    const dashboard = await this.db.withTenant(payload.tenantId, async (client) => {
      const dashRes = await client.query('SELECT id, name FROM app.dashboards WHERE id = $1', [dashboardId]);
      const widgetsRes = await client.query(
        'SELECT id, kind, title, kpi_key FROM app.dashboard_widgets WHERE dashboard_id = $1',
        [dashboardId],
      );
      return { ...dashRes.rows[0], widgets: widgetsRes.rows };
    });

    // Embedded viewers have no session of their own to authorize per-widget KPI
    // calls, so we resolve KPI values server-side here and return one flat payload.
    const widgetsWithData = await Promise.all(
      dashboard.widgets.map(async (w: any) => ({
        ...w,
        data: w.kpi_key ? await this.engine.getKpiValues(payload.tenantId, w.kpi_key) : null,
      })),
    );

    return { ...dashboard, widgets: widgetsWithData };
  }
}
