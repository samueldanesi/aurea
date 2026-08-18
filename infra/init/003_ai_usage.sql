-- AI model call log: powers both the anti-hallucination audit trail (every generated_sql
-- is already stored in app.ai_messages) and the per-tenant cost/usage view in the platform
-- admin panel (spec section 8: "quanto costo AI generato" per account).

CREATE TABLE app.ai_usage_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    model           TEXT NOT NULL,
    input_tokens    INTEGER NOT NULL DEFAULT 0,
    output_tokens   INTEGER NOT NULL DEFAULT 0,
    purpose         TEXT NOT NULL, -- chat | insight | anomaly | forecast
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_tenant_time ON app.ai_usage_log (tenant_id, created_at);

ALTER TABLE app.ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON app.ai_usage_log
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
