from fastapi import APIRouter
from pydantic import BaseModel

from app.connectors.registry import get_connector
from app.security.vault import read_secret

router = APIRouter(prefix="/connectors", tags=["connectors"])


class TestConnectionRequest(BaseModel):
    tenantId: str
    connectorType: str
    config: dict
    secretRef: str | None = None


@router.post("/test")
def test_connection(req: TestConnectionRequest):
    connector = get_connector(req.connectorType)
    credentials = read_secret(req.secretRef) if req.secretRef else {}
    ok, message = connector.test_connection(req.config, credentials)
    return {"ok": ok, "message": message}
