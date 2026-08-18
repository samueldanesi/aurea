from fastapi import APIRouter
from pydantic import BaseModel

from app.security.vault import store_secret

router = APIRouter(prefix="/vault", tags=["vault"])


class StoreSecretRequest(BaseModel):
    tenantId: str
    payload: dict


@router.post("/secrets")
def create_secret(req: StoreSecretRequest):
    secret_ref = store_secret(req.tenantId, req.payload)
    return {"secretRef": secret_ref}
