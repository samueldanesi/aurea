import base64
import hashlib
import json
import uuid

from cryptography.fernet import Fernet

from app.config import settings
from app.db import platform_conn, dict_cursor


def _fernet() -> Fernet:
    # Derive a valid 32-byte urlsafe-base64 Fernet key from the configured secret so
    # operators can set any passphrase in CREDENTIALS_ENCRYPTION_KEY without worrying
    # about Fernet's exact key-format requirements.
    digest = hashlib.sha256(settings.credentials_encryption_key.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def store_secret(tenant_id: str, payload: dict) -> str:
    """Encrypts and stores connector credentials, returns an opaque secret_ref (uuid)."""
    token = _fernet().encrypt(json.dumps(payload).encode()).decode()
    secret_id = str(uuid.uuid4())
    with platform_conn() as conn, dict_cursor(conn) as cur:
        cur.execute(
            "INSERT INTO vault.connection_secrets (id, tenant_id, encrypted_value) VALUES (%s, %s, %s)",
            (secret_id, tenant_id, token),
        )
    return secret_id


def read_secret(secret_ref: str) -> dict:
    with platform_conn() as conn, dict_cursor(conn) as cur:
        cur.execute(
            "SELECT encrypted_value FROM vault.connection_secrets WHERE id = %s",
            (secret_ref,),
        )
        row = cur.fetchone()
    if not row:
        raise KeyError(f"No secret stored for ref {secret_ref}")
    plaintext = _fernet().decrypt(row["encrypted_value"].encode())
    return json.loads(plaintext)
