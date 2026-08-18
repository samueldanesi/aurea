import json

import anthropic

from app.config import settings
from app.ai.guardrails import SYSTEM_PROMPT
from app.semantic.layer import discover_schema, execute_kpi, execute_readonly_sql

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

GENERATE_SQL_TOOL = {
    "name": "answer_with_data",
    "description": (
        "Declare how to answer the user's question: either reuse an existing KPI "
        "definition by key, or provide a new read-only SQL SELECT against the "
        "warehouse.raw_records table (columns: tenant_id, entity, external_id, "
        "data jsonb). Always prefer an existing KPI when one matches."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "kpi_key": {
                "type": "string",
                "description": "Key of an existing KPI definition to reuse, if one matches. Omit otherwise.",
            },
            "sql": {
                "type": "string",
                "description": "A single read-only SELECT statement, only if no existing KPI matches.",
            },
            "reasoning": {"type": "string", "description": "One short sentence on why this approach answers the question."},
        },
        "required": ["reasoning"],
    },
}


def generate_query_plan(tenant_id: str, message: str, model: str) -> dict:
    schema = discover_schema(tenant_id)
    context = (
        f"Schema disponibile per questo tenant:\n{json.dumps(schema, ensure_ascii=False, indent=2)}\n\n"
        f"Domanda utente: {message}"
    )

    response = _client.messages.create(
        model=model,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        tools=[GENERATE_SQL_TOOL],
        tool_choice={"type": "tool", "name": "answer_with_data"},
        messages=[{"role": "user", "content": context}],
    )

    tool_use = next(block for block in response.content if block.type == "tool_use")
    return {"plan": tool_use.input, "usage": response.usage}


def run_query_plan(tenant_id: str, plan: dict) -> tuple[list[dict], str | None]:
    if plan.get("kpi_key"):
        return execute_kpi(tenant_id, plan["kpi_key"]), None
    if plan.get("sql"):
        return execute_readonly_sql(tenant_id, plan["sql"]), plan["sql"]
    return [], None
