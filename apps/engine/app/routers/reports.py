from fastapi import APIRouter, Response

from app.reporting.pdf import render_dashboard_pdf

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard/{tenant_id}/{dashboard_id}/pdf")
def dashboard_pdf(tenant_id: str, dashboard_id: str):
    pdf_bytes = render_dashboard_pdf(tenant_id, dashboard_id)
    return Response(content=pdf_bytes, media_type="application/pdf")
