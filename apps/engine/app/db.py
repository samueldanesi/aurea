from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool

from app.config import settings

_pool: ThreadedConnectionPool | None = None


def _get_pool() -> ThreadedConnectionPool:
    # Lazy singleton: opening connections at import time would crash the whole
    # process (FastAPI app, Celery worker, or a standalone script) if Postgres
    # isn't reachable yet at startup, instead of failing just the request/task
    # that actually needed a connection.
    global _pool
    if _pool is None:
        _pool = ThreadedConnectionPool(minconn=1, maxconn=10, dsn=settings.database_url_engine)
    return _pool


@contextmanager
def tenant_conn(tenant_id: str):
    """
    Mirrors apps/api's DbService.withTenant(): checks out a connection, sets
    app.current_tenant_id for the transaction so Postgres RLS scopes every
    query to this tenant, commits on success / rolls back on error.
    """
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT set_config('app.current_tenant_id', %s, true)", (tenant_id,))
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


@contextmanager
def platform_conn():
    """Escape hatch for cross-tenant platform operations (scheduler scanning all connections)."""
    pool = _get_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def dict_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
