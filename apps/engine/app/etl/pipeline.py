import json
import logging
from datetime import datetime, timezone

from app.connectors.registry import get_connector
from app.db import tenant_conn, dict_cursor
from app.security.vault import read_secret

logger = logging.getLogger(__name__)

BATCH_SIZE = 500


def run_sync(tenant_id: str, connection_id: str) -> dict:
    """
    Extract -> normalize -> upsert-into-warehouse for one data connection.
    Runs inside the tenant's RLS-scoped transaction the whole way through, and
    writes a row to app.sync_logs regardless of outcome so failures are visible
    to the tenant admin (spec 1: "log di ogni sincronizzazione ... alert in caso
    di fallimento"). Upsert-on-external_id is the "dedupe automatica" + a cheap
    stand-in for real CDC: a full incremental read every run, keyed so re-runs
    are idempotent, rather than a true source-side change stream.
    """
    with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
        cur.execute(
            "SELECT * FROM app.data_connections WHERE id = %s AND tenant_id = %s",
            (connection_id, tenant_id),
        )
        connection = cur.fetchone()
        if not connection:
            raise ValueError("Connection not found")

        cur.execute(
            "INSERT INTO app.sync_logs (tenant_id, connection_id, status) VALUES (%s, %s, 'running') RETURNING id",
            (tenant_id, connection_id),
        )
        log_id = cur.fetchone()["id"]

    rows_processed = 0
    try:
        credentials = read_secret(connection["secret_ref"])
        connector = get_connector(connection["connector_type"])
        config = connection["config"] if isinstance(connection["config"], dict) else json.loads(connection["config"])

        with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
            batch = []
            for record in connector.extract(config, credentials):
                batch.append(record)
                if len(batch) >= BATCH_SIZE:
                    _upsert_batch(cur, tenant_id, connection_id, batch)
                    rows_processed += len(batch)
                    batch = []
            if batch:
                _upsert_batch(cur, tenant_id, connection_id, batch)
                rows_processed += len(batch)

            cur.execute(
                """UPDATE app.sync_logs
                   SET status = 'success', rows_processed = %s, finished_at = now()
                   WHERE id = %s""",
                (rows_processed, log_id),
            )
        return {"status": "success", "rowsProcessed": rows_processed}

    except Exception as exc:  # noqa: BLE001 - always recorded, then re-raised for the caller/retry policy
        logger.exception("Sync failed for connection %s", connection_id)
        with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
            cur.execute(
                """UPDATE app.sync_logs
                   SET status = 'error', error_message = %s, rows_processed = %s, finished_at = now()
                   WHERE id = %s""",
                (str(exc), rows_processed, log_id),
            )
        raise


def _upsert_batch(cur, tenant_id: str, connection_id: str, batch) -> None:
    for record in batch:
        cur.execute(
            """
            INSERT INTO warehouse.raw_records (tenant_id, connection_id, entity, external_id, data, ingested_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (tenant_id, connection_id, entity, external_id)
            DO UPDATE SET data = EXCLUDED.data, ingested_at = EXCLUDED.ingested_at
            """,
            (
                tenant_id,
                connection_id,
                record.entity,
                record.external_id,
                json.dumps(record.data, default=str),
                datetime.now(timezone.utc),
            ),
        )
