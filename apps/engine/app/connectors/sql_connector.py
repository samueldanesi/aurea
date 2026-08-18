from typing import Iterator, Optional

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

from .base import Connector, Record

_DRIVERS = {
    "postgres": "postgresql+psycopg2",
    "mysql": "mysql+pymysql",
    "sqlserver": "mssql+pyodbc",
    "oracle": "oracle+cx_oracle",
}


class SqlConnector(Connector):
    """
    Generic relational-source connector (MySQL, PostgreSQL, SQL Server, Oracle --
    the "database" bucket from the spec's connector list). `config` must provide:
      dialect, host, port, database, entity, external_id_field, query
    `query` is a client-authored read-only SELECT (the admin configures it when
    setting up the connection); we do not attempt to auto-discover schemas here.
    """

    def _build_url(self, config: dict, credentials: dict) -> URL:
        driver = _DRIVERS.get(config["dialect"])
        if not driver:
            raise ValueError(f"Unsupported SQL dialect: {config['dialect']}")
        return URL.create(
            driver,
            username=credentials.get("username"),
            password=credentials.get("password"),
            host=config["host"],
            port=config.get("port"),
            database=config["database"],
        )

    def test_connection(self, config: dict, credentials: dict) -> tuple[bool, str]:
        try:
            engine = create_engine(self._build_url(config, credentials), pool_pre_ping=True)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True, "ok"
        except Exception as exc:  # noqa: BLE001 - surfaced to the admin UI as a diagnostic
            return False, str(exc)

    def extract(
        self, config: dict, credentials: dict, since: Optional[str] = None
    ) -> Iterator[Record]:
        engine = create_engine(self._build_url(config, credentials), pool_pre_ping=True)
        query = config["query"]
        params = {}
        if since and "{since_clause}" in query:
            query = query.replace("{since_clause}", "AND updated_at > :since")
            params["since"] = since
        elif "{since_clause}" in query:
            query = query.replace("{since_clause}", "")

        with engine.connect() as conn:
            result = conn.execution_options(stream_results=True).execute(text(query), params)
            for row in result.mappings():
                row_dict = dict(row)
                external_id = str(row_dict.get(config["external_id_field"]))
                yield Record(entity=config["entity"], external_id=external_id, data=row_dict)
