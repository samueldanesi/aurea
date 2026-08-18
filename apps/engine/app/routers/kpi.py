from fastapi import APIRouter

from app.semantic.layer import execute_kpi

router = APIRouter(prefix="/kpi", tags=["kpi"])


@router.get("/{tenant_id}/{kpi_key}/values")
def kpi_values(tenant_id: str, kpi_key: str):
    return {"kpiKey": kpi_key, "rows": execute_kpi(tenant_id, kpi_key)}
