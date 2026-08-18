from fastapi import FastAPI

from app.routers import vault, sync, connectors, ai, kpi, reports

app = FastAPI(title="BI/AI Platform Engine", version="0.1.0")

app.include_router(vault.router)
app.include_router(sync.router)
app.include_router(connectors.router)
app.include_router(ai.router)
app.include_router(kpi.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {"status": "ok"}
