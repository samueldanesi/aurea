import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DbService } from '../common/db/db.service';
import { EngineClientService } from '../common/engine/engine-client.service';

@Injectable()
export class DashboardsService {
  constructor(
    private readonly db: DbService,
    private readonly jwt: JwtService,
    private readonly engine: EngineClientService,
  ) {}

  exportPdf(tenantId: string, dashboardId: string) {
    return this.engine.getDashboardPdf(tenantId, dashboardId);
  }

  /**
   * Spec section 7 embedded-analytics feature: a scoped, short-lived token that lets
   * a dashboard be dropped into another site/intranet via <iframe src="/embed/:id?token=...">
   * without exposing the viewer's normal login. Distinct `scope: 'embed'` payload so
   * this token can never be reused against the authenticated API surface.
   */
  createEmbedToken(tenantId: string, dashboardId: string, expiresIn = '24h') {
    return this.jwt.sign({ tenantId, dashboardId, scope: 'embed' }, { expiresIn });
  }

  list(tenantId: string) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        'SELECT * FROM app.dashboards ORDER BY created_at DESC',
      );
      return res.rows;
    });
  }

  async get(tenantId: string, id: string) {
    return this.db.withTenant(tenantId, async (client) => {
      const dashboard = await client.query(
        'SELECT * FROM app.dashboards WHERE id = $1',
        [id],
      );
      if (dashboard.rowCount === 0) throw new NotFoundException('Dashboard not found');
      const widgets = await client.query(
        'SELECT * FROM app.dashboard_widgets WHERE dashboard_id = $1',
        [id],
      );
      return { ...dashboard.rows[0], widgets: widgets.rows };
    });
  }

  create(tenantId: string, userId: string, name: string, isTemplate = false) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO app.dashboards (tenant_id, name, is_template, created_by)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [tenantId, name, isTemplate, userId],
      );
      return res.rows[0];
    });
  }

  addWidget(
    tenantId: string,
    dashboardId: string,
    widget: { kind: string; title?: string; kpiKey?: string; config?: object; position?: object },
  ) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO app.dashboard_widgets
           (tenant_id, dashboard_id, kind, title, kpi_key, config, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          tenantId,
          dashboardId,
          widget.kind,
          widget.title ?? null,
          widget.kpiKey ?? null,
          JSON.stringify(widget.config ?? {}),
          JSON.stringify(widget.position ?? {}),
        ],
      );
      return res.rows[0];
    });
  }

  updateLayout(tenantId: string, dashboardId: string, layout: unknown[]) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `UPDATE app.dashboards SET layout = $1, updated_at = now()
         WHERE id = $2 RETURNING *`,
        [JSON.stringify(layout), dashboardId],
      );
      if (res.rowCount === 0) throw new NotFoundException('Dashboard not found');
      return res.rows[0];
    });
  }

  remove(tenantId: string, id: string) {
    return this.db.withTenant(tenantId, async (client) => {
      await client.query('DELETE FROM app.dashboards WHERE id = $1', [id]);
      return { deleted: true };
    });
  }

  /** Clone a template dashboard (built-in or another tenant's shared template) into this tenant. */
  async cloneTemplate(tenantId: string, userId: string, templateDashboardId: string) {
    return this.db.withTenant(tenantId, async (client) => {
      const template = await client.query(
        'SELECT * FROM app.dashboards WHERE id = $1 AND is_template = true',
        [templateDashboardId],
      );
      if (template.rowCount === 0) throw new NotFoundException('Template not found');
      const widgets = await client.query(
        'SELECT * FROM app.dashboard_widgets WHERE dashboard_id = $1',
        [templateDashboardId],
      );

      const created = await client.query(
        `INSERT INTO app.dashboards (tenant_id, name, layout, created_by)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [tenantId, template.rows[0].name, template.rows[0].layout, userId],
      );
      const newDashboardId = created.rows[0].id;

      for (const w of widgets.rows) {
        await client.query(
          `INSERT INTO app.dashboard_widgets
             (tenant_id, dashboard_id, kind, title, kpi_key, config, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [tenantId, newDashboardId, w.kind, w.title, w.kpi_key, w.config, w.position],
        );
      }
      return created.rows[0];
    });
  }
}
