-- Connector credentials vault. Lives in its own schema, never joined into
-- tenant-facing queries directly -- only apps/engine's security/vault.py reads it,
-- and only by secret_ref (an opaque uuid the app layer stores, never the credentials
-- themselves). Values are encrypted at the application layer (Fernet, see vault.py)
-- before being written here, so a DB dump alone does not expose plaintext credentials.

CREATE SCHEMA IF NOT EXISTS vault;

CREATE TABLE vault.connection_secrets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_connection_secrets_tenant ON vault.connection_secrets (tenant_id);
