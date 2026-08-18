import anthropic

from app.config import settings
from app.ai.guardrails import SYSTEM_PROMPT
from app.semantic.layer import execute_kpi

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

# Convention: KPI definitions used for insights/anomaly/forecast must return rows
# shaped {period, value} (one row per period, e.g. one per month), ordered ascending.
# This keeps the AI features generic across any KPI instead of hardcoding "revenue".


def generate_period_insight(tenant_id: str, kpi_key: str) -> dict:
    rows = execute_kpi(tenant_id, kpi_key)
    if len(rows) < 2:
        return {"insight": None, "reason": "not_enough_history"}

    latest, previous = rows[-1], rows[-2]
    latest_val, prev_val = float(latest["value"]), float(previous["value"])
    delta_pct = ((latest_val - prev_val) / prev_val * 100) if prev_val else None

    prompt = (
        f"KPI '{kpi_key}'. Periodo precedente ({previous['period']}): {prev_val}. "
        f"Periodo corrente ({latest['period']}): {latest_val}. "
        f"Variazione: {f'{delta_pct:.1f}%' if delta_pct is not None else 'N/A'}.\n"
        "Scrivi una frase (max 30 parole) che descrive questa variazione in italiano, "
        "usando solo i numeri sopra -- nessun altro dato o causa che non sia deducibile da questi valori."
    )
    response = _client.messages.create(
        model=settings.ai_cheap_model,
        max_tokens=200,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(block.text for block in response.content if block.type == "text")
    return {
        "insight": text,
        "kpiKey": kpi_key,
        "currentPeriod": latest["period"],
        "currentValue": latest_val,
        "previousValue": prev_val,
        "deltaPct": delta_pct,
    }
