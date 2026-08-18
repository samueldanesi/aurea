from app.db import tenant_conn, dict_cursor

READ_ONLY_FORBIDDEN = ("insert ", "update ", "delete ", "drop ", "alter ", "grant ", "truncate ", ";")


def _assert_read_only(sql: str) -> None:
    lowered = sql.lower()
    if any(token in lowered for token in READ_ONLY_FORBIDDEN):
        raise ValueError("KPI/AI-generated SQL must be a single read-only SELECT")


def get_kpi_definition(tenant_id: str, kpi_key: str) -> dict:
    with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
        cur.execute(
            """SELECT * FROM app.kpi_definitions
               WHERE tenant_id = %s AND key = %s
               ORDER BY version DESC LIMIT 1""",
            (tenant_id, kpi_key),
        )
        row = cur.fetchone()
    if not row:
        raise KeyError(f"No KPI definition for key '{kpi_key}'")
    return row


def list_kpi_definitions(tenant_id: str) -> list[dict]:
    with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
        cur.execute(
            """SELECT DISTINCT ON (key) * FROM app.kpi_definitions
               WHERE tenant_id = %s ORDER BY key, version DESC""",
            (tenant_id,),
        )
        return cur.fetchall()


def execute_kpi(tenant_id: str, kpi_key: str, extra_filters: dict | None = None) -> list[dict]:
    """
    Runs a KPI's centrally-defined SQL and returns the rows -- this is the single
    place "net revenue" (or any other metric) is computed, so every dashboard
    widget and every AI chat answer that cites this KPI derives it identically
    (spec 2: the semantic-layer consistency problem enterprise tools get flagged for).
    """
    definition = get_kpi_definition(tenant_id, kpi_key)
    sql = definition["sql_expression"]
    _assert_read_only(sql)

    with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
        cur.execute(sql)
        return cur.fetchall()


def discover_schema(tenant_id: str) -> dict:
    """
    Gives the AI/NL-to-SQL layer just enough structure to write valid SQL against
    warehouse.raw_records' JSONB shape: which entities exist and a sample of the
    keys inside each one's `data` column. This is a placeholder for a proper
    modeled warehouse (typed fact/dim tables) -- see docs/ROADMAP.md phase 2.
    """
    with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
        cur.execute(
            """SELECT entity, count(*) AS row_count,
                      (array_agg(data))[1] AS sample
               FROM warehouse.raw_records
               WHERE tenant_id = %s
               GROUP BY entity""",
            (tenant_id,),
        )
        entities = cur.fetchall()

    return {
        "entities": [
            {
                "name": e["entity"],
                "row_count": e["row_count"],
                "sample_fields": sorted((e["sample"] or {}).keys()),
            }
            for e in entities
        ],
        "kpi_definitions": [
            {"key": k["key"], "label": k["label"], "description": k["description"]}
            for k in list_kpi_definitions(tenant_id)
        ],
    }


def execute_readonly_sql(tenant_id: str, sql: str) -> list[dict]:
    """Used by the AI NL-to-SQL path -- same read-only guard, arbitrary (model-generated) SELECT."""
    _assert_read_only(sql)
    with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
        cur.execute(sql)
        return cur.fetchall()
