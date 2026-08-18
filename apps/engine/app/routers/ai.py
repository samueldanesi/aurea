from fastapi import APIRouter
from pydantic import BaseModel

from app.ai.chat_service import answer_question
from app.ai.insights import generate_period_insight
from app.ai.forecast import forecast_linear
from app.semantic.layer import execute_kpi

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatRequest(BaseModel):
    tenantId: str
    userId: str
    conversationId: str | None = None
    message: str


@router.post("/chat")
def chat(req: ChatRequest):
    return answer_question(req.tenantId, req.message)


@router.get("/insights/{tenant_id}/{kpi_key}")
def insight(tenant_id: str, kpi_key: str):
    return generate_period_insight(tenant_id, kpi_key)


@router.get("/forecast/{tenant_id}/{kpi_key}")
def forecast(tenant_id: str, kpi_key: str, periods: int = 3):
    rows = execute_kpi(tenant_id, kpi_key)
    series = [float(r["value"]) for r in rows]
    projected = forecast_linear(series, periods)
    return {
        "kpiKey": kpi_key,
        "history": rows,
        "forecast": [{"stepsAhead": i + 1, "value": v} for i, v in enumerate(projected)],
    }
