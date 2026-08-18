-- BI/AI Platform - initial schema (v0.1)
-- Two schemas:
--   app        -> control plane (tenants, users, dashboards, connections, kpi defs, alerts, audit)
--   warehouse  -> landing + modeled analytical data ingested from client gestionali
--
-- Multi-tenancy strategy: shared tables + tenant_id column + Postgres Row-Level Security.
-- Every app-facing query runs with `SET app.current_tenant_id = '<uuid>'` set by the API layer
-- per-request, so a bug in application code cannot leak one tenant's rows into another's response.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS warehouse;

-- ============================================================
-- app schema
-- ============================================================

CREATE TABLE app.tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    plan            TEXT NOT NULL DEFAULT 'trial',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    branding        JSONB NOT NULL DEFAULT '{}'::jsonb, -- logo url, colors (white-label)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    email           CITEXT,
    password_hash   TEXT, -- null if SSO-only
    full_name       TEXT,
    totp_secret     TEXT, -- 2FA, encrypted at rest by app layer
    totp_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    sso_provider    TEXT,
    sso_subject     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);

CREATE TABLE app.roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL, -- e.g. owner, admin, viewer, agent
    permissions     JSONB NOT NULL DEFAULT '[]'::jsonb, -- list of permission strings
    row_filter      JSONB, -- optional row-level security rule, e.g. {"field": "agent_id", "value": "$user.id"}
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

CREATE TABLE app.user_roles (
    user_id         UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES app.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE app.data_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    connector_type  TEXT NOT NULL, -- postgres | mysql | sqlserver | oracle | csv | rest_api | google_sheets
    config          JSONB NOT NULL DEFAULT '{}'::jsonb, -- non-secret config (host, port, db name, mapping)
    secret_ref      TEXT NOT NULL, -- reference/key into vault (never store raw credentials here)
    sync_schedule   TEXT, -- cron expression
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app.sync_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    connection_id   UUID NOT NULL REFERENCES app.data_connections(id) ON DELETE CASCADE,
    status          TEXT NOT NULL, -- running | success | error
    rows_processed  INTEGER,
    error_message   TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ
);

-- Semantic layer: centrally defined metrics/KPIs so "fatturato netto" means the same
-- thing on every dashboard instead of being recomputed ad hoc per widget.
CREATE TABLE app.kpi_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    key             TEXT NOT NULL, -- e.g. "net_revenue"
    label           TEXT NOT NULL,
    description     TEXT,
    sql_expression  TEXT NOT NULL, -- templated SQL over warehouse tables
    unit            TEXT, -- currency | percent | count | ...
    version         INTEGER NOT NULL DEFAULT 1,
    created_by      UUID REFERENCES app.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, key, version)
);

CREATE TABLE app.dashboards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    layout          JSONB NOT NULL DEFAULT '[]'::jsonb, -- widget grid layout
    is_template     BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      UUID REFERENCES app.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app.dashboard_widgets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    dashboard_id    UUID NOT NULL REFERENCES app.dashboards(id) ON DELETE CASCADE,
    kind            TEXT NOT NULL, -- line | bar | pie | pivot | kpi_card | heatmap | funnel | gauge | map
    title           TEXT,
    kpi_key         TEXT, -- references kpi_definitions.key
    config          JSONB NOT NULL DEFAULT '{}'::jsonb, -- filters, grouping, chart options
    position        JSONB NOT NULL DEFAULT '{}'::jsonb -- x, y, w, h
);

CREATE TABLE app.alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    kpi_key         TEXT NOT NULL,
    condition       JSONB NOT NULL, -- {"op": "<", "value": 20} or {"type": "anomaly"}
    channels        JSONB NOT NULL DEFAULT '["email"]'::jsonb,
    recipients      JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app.alert_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    alert_id        UUID NOT NULL REFERENCES app.alerts(id) ON DELETE CASCADE,
    triggered_value NUMERIC,
    message         TEXT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app.audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES app.users(id),
    action          TEXT NOT NULL,
    entity          TEXT,
    entity_id       UUID,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app.ai_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES app.users(id),
    title           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app.ai_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES app.ai_conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL, -- user | assistant
    content         TEXT NOT NULL,
    -- generated_sql / result_rows let the UI show "this is where the number came from",
    -- and let us guardrail: the assistant must attach the query that produced any figure it cites.
    generated_sql   TEXT,
    result_rows     JSONB,
    model_used      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Row-Level Security: every tenant-scoped table only returns rows
-- matching the tenant id set on the current DB session/transaction.
-- ============================================================

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'app' AND tablename <> 'tenants'
    LOOP
        EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON app.%I
             USING (tenant_id = current_setting(''app.current_tenant_id'', true)::uuid);',
            t
        );
    END LOOP;
END $$;

-- ============================================================
-- warehouse schema
-- ============================================================

-- Universal landing table: every connector writes here first (schema-on-read),
-- regardless of source shape. The ETL layer later models this into typed
-- fact/dim tables per tenant/vertical. Keeping this generic avoids having to
-- redesign the warehouse schema for every new gestionale we connect to.
CREATE TABLE warehouse.raw_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    connection_id   UUID NOT NULL,
    entity          TEXT NOT NULL, -- e.g. "invoice", "order", "customer"
    external_id     TEXT NOT NULL, -- id in the source system, for CDC/upsert
    data            JSONB NOT NULL,
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, connection_id, entity, external_id)
);

CREATE INDEX idx_raw_records_tenant_entity ON warehouse.raw_records (tenant_id, entity);
CREATE INDEX idx_raw_records_data_gin ON warehouse.raw_records USING GIN (data);

ALTER TABLE warehouse.raw_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warehouse.raw_records
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
