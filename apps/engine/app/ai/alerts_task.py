import logging

from app.ai.anomaly import detect_anomalies
from app.ai.notifications import send_notification
from app.db import platform_conn, tenant_conn, dict_cursor
from app.etl.celery_app import celery_app
from app.semantic.layer import execute_kpi

logger = logging.getLogger(__name__)


def _evaluate_condition(condition: dict, rows: list[dict]) -> tuple[bool, float | None, str]:
    if not rows:
        return False, None, ""

    latest_value = float(rows[-1]["value"])

    if condition.get("type") == "anomaly":
        series = [float(r["value"]) for r in rows]
        anomalous_indices = detect_anomalies(series)
        triggered = (len(series) - 1) in anomalous_indices
        return triggered, latest_value, "Valore rilevato come anomalo rispetto allo storico recente"

    op = condition.get("op")
    threshold = condition.get("value")
    ops = {
        "<": lambda v: v < threshold,
        ">": lambda v: v > threshold,
        "<=": lambda v: v <= threshold,
        ">=": lambda v: v >= threshold,
        "==": lambda v: v == threshold,
    }
    check = ops.get(op)
    triggered = bool(check and check(latest_value))
    return triggered, latest_value, f"Valore {latest_value} {op} soglia {threshold}"


@celery_app.task
def evaluate_all_alerts():
    with platform_conn() as conn, dict_cursor(conn) as cur:
        cur.execute("SELECT id FROM app.tenants WHERE is_active = true")
        tenant_ids = [r["id"] for r in cur.fetchall()]

    for tenant_id in tenant_ids:
        try:
            _evaluate_tenant_alerts(str(tenant_id))
        except Exception:  # noqa: BLE001 - one tenant's bad KPI/alert config must not block the rest
            logger.exception("Alert evaluation failed for tenant %s", tenant_id)


def _evaluate_tenant_alerts(tenant_id: str):
    with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
        cur.execute("SELECT * FROM app.alerts WHERE tenant_id = %s AND is_active = true", (tenant_id,))
        alerts = cur.fetchall()

    for alert in alerts:
        try:
            rows = execute_kpi(tenant_id, alert["kpi_key"])
        except KeyError:
            continue

        triggered, value, message = _evaluate_condition(alert["condition"], rows)
        if not triggered:
            continue

        with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
            cur.execute(
                """INSERT INTO app.alert_events (tenant_id, alert_id, triggered_value, message)
                   VALUES (%s, %s, %s, %s)""",
                (tenant_id, alert["id"], value, message),
            )

        for channel in alert["channels"]:
            send_notification(
                channel,
                alert["recipients"],
                subject=f"[Alert] {alert['name']}",
                body=message,
            )
