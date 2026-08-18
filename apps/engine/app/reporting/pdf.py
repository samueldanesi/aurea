import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from app.db import tenant_conn, dict_cursor
from app.semantic.layer import execute_kpi


def render_dashboard_pdf(tenant_id: str, dashboard_id: str, branding: dict | None = None) -> bytes:
    """
    Spec section 7 ("Report PDF generati automaticamente con branding aziendale").
    Deliberately table-based rather than chart-based -- rendering the recharts
    widgets server-side would need a headless browser; a clean table per KPI
    covers the "send me the numbers" use case without that dependency. Swap in
    a chart-image renderer later if tenants ask for visual parity with the dashboard.
    """
    branding = branding or {}
    with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
        cur.execute("SELECT * FROM app.dashboards WHERE id = %s AND tenant_id = %s", (dashboard_id, tenant_id))
        dashboard = cur.fetchone()
        if not dashboard:
            raise ValueError("Dashboard not found")
        cur.execute("SELECT * FROM app.dashboard_widgets WHERE dashboard_id = %s", (dashboard_id,))
        widgets = cur.fetchall()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = [
        Paragraph(branding.get("company_name", "BI/AI Platform"), styles["Title"]),
        Paragraph(dashboard["name"], styles["Heading2"]),
        Spacer(1, 12),
    ]

    for widget in widgets:
        if not widget["kpi_key"]:
            continue
        story.append(Paragraph(widget["title"] or widget["kpi_key"], styles["Heading3"]))
        try:
            rows = execute_kpi(tenant_id, widget["kpi_key"])
        except KeyError:
            story.append(Paragraph("KPI non definito.", styles["Normal"]))
            continue

        if not rows:
            story.append(Paragraph("Nessun dato disponibile.", styles["Normal"]))
        else:
            headers = list(rows[0].keys())
            table_data = [headers] + [[str(r[h]) for h in headers] for r in rows[:100]]
            table = Table(table_data, hAlign="LEFT")
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTSIZE", (0, 0), (-1, -1), 8),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ]
                )
            )
            story.append(table)
        story.append(Spacer(1, 16))

    doc.build(story)
    return buffer.getvalue()
