import json

import anthropic

from app.config import settings
from app.ai.guardrails import SYSTEM_PROMPT
from app.ai.model_router import choose_model
from app.ai.nl2sql import generate_query_plan, run_query_plan
from app.db import tenant_conn, dict_cursor

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _log_usage(tenant_id: str, model: str, usage, purpose: str) -> None:
    with tenant_conn(tenant_id) as conn, dict_cursor(conn) as cur:
        cur.execute(
            """INSERT INTO app.ai_usage_log (tenant_id, model, input_tokens, output_tokens, purpose)
               VALUES (%s, %s, %s, %s, %s)""",
            (tenant_id, model, getattr(usage, "input_tokens", 0), getattr(usage, "output_tokens", 0), purpose),
        )


def answer_question(tenant_id: str, message: str) -> dict:
    """
    Two-step grounded answer, per the anti-hallucination guardrail in the spec:
    1) the model proposes a KPI/SQL plan (no numbers yet, just a query)
    2) we execute that plan for real against the tenant's data
    3) a second, separate model call turns the *actual query result* into prose,
       explicitly forbidden from adding any figure not present in that result.
    Step 3 always uses the cheap model: by then the hard part (deciding what data
    to fetch) is done, phrasing a result set into a sentence doesn't need the
    stronger model.
    """
    model = choose_model(message)
    plan_result = generate_query_plan(tenant_id, message, model)
    _log_usage(tenant_id, model, plan_result["usage"], "chat")

    plan = plan_result["plan"]
    try:
        rows, generated_sql = run_query_plan(tenant_id, plan)
    except Exception as exc:  # noqa: BLE001
        return {
            "answer": (
                "Non sono riuscito a recuperare questo dato in modo affidabile "
                f"({exc}). Prova a riformulare la domanda o verifica che la fonte dati sia collegata."
            ),
            "generatedSql": plan.get("sql"),
            "resultRows": None,
            "modelUsed": model,
        }

    phrasing_prompt = (
        "Risultato della query eseguita sui dati reali del cliente (JSON):\n"
        f"{json.dumps(rows[:50], ensure_ascii=False, default=str)}\n\n"
        f"Domanda originale dell'utente: {message}\n\n"
        "Scrivi una risposta breve e leggibile in italiano usando ESCLUSIVAMENTE i "
        "numeri presenti in questo JSON. Se il risultato è vuoto, dillo chiaramente "
        "invece di inventare un valore."
    )
    phrasing_model = settings.ai_cheap_model
    response = _client.messages.create(
        model=phrasing_model,
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": phrasing_prompt}],
    )
    _log_usage(tenant_id, phrasing_model, response.usage, "chat")

    answer_text = "".join(block.text for block in response.content if block.type == "text")

    return {
        "answer": answer_text,
        "generatedSql": generated_sql,
        "resultRows": rows[:50],
        "modelUsed": model,
    }
