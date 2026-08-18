from fastapi import APIRouter
from pydantic import BaseModel

from app.etl.tasks import run_sync_task

router = APIRouter(prefix="/sync", tags=["sync"])


class TriggerSyncRequest(BaseModel):
    tenantId: str
    connectionId: str


@router.post("/trigger")
def trigger_sync(req: TriggerSyncRequest):
    # Fire-and-forget: enqueued on Celery so the HTTP call from apps/api returns
    # immediately; the admin UI polls GET /connections/:id/sync-logs for status.
    task = run_sync_task.delay(req.tenantId, req.connectionId)
    return {"taskId": task.id, "status": "queued"}
