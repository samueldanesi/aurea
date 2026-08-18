import logging
from datetime import datetime, timezone

from croniter import croniter

from app.db import platform_conn, dict_cursor
from app.etl.celery_app import celery_app
from app.etl.pipeline import run_sync

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def run_sync_task(self, tenant_id: str, connection_id: str):
    try:
        return run_sync(tenant_id, connection_id)
    except Exception as exc:  # noqa: BLE001
        # Automatic retry with backoff, per spec 1 ("retry automatico e alert in
        # caso di fallimento sync"). Alerting on final failure happens via the
        # alerts_task consumer of app.sync_logs status='error' rows.
        raise self.retry(exc=exc)


@celery_app.task
def scan_and_enqueue_due_syncs():
    now = datetime.now(timezone.utc)
    with platform_conn() as conn, dict_cursor(conn) as cur:
        cur.execute(
            """SELECT id, tenant_id, sync_schedule,
                      (SELECT max(finished_at) FROM app.sync_logs sl WHERE sl.connection_id = dc.id) AS last_run
               FROM app.data_connections dc
               WHERE is_active = true AND sync_schedule IS NOT NULL"""
        )
        connections = cur.fetchall()

    for conn_row in connections:
        base = conn_row["last_run"] or now
        try:
            itr = croniter(conn_row["sync_schedule"], base)
            next_run = itr.get_next(datetime)
        except (ValueError, KeyError):
            logger.warning("Invalid cron for connection %s: %s", conn_row["id"], conn_row["sync_schedule"])
            continue

        if conn_row["last_run"] is None or next_run <= now:
            run_sync_task.delay(str(conn_row["tenant_id"]), str(conn_row["id"]))
