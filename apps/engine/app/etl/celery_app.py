from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery("bi_engine", broker=settings.redis_url, backend=settings.redis_url)

celery_app.conf.beat_schedule = {
    # Every minute, check which active connections are due per their own cron
    # schedule and enqueue a sync for each. Keeps per-tenant cadence configurable
    # (app.data_connections.sync_schedule) without one Celery beat entry per tenant.
    "scan-due-connections": {
        "task": "app.etl.tasks.scan_and_enqueue_due_syncs",
        "schedule": crontab(minute="*"),
    },
    "evaluate-alerts": {
        "task": "app.ai.alerts_task.evaluate_all_alerts",
        "schedule": crontab(minute="*/5"),
    },
}
celery_app.conf.timezone = "UTC"
celery_app.autodiscover_tasks(["app.etl", "app.ai"])
