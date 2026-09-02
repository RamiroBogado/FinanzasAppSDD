from datetime import date
import json
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from app.config import OLLAMA_HOST, OLLAMA_MODEL

_MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

SYSTEM_PROMPT = """Sos el asistente financiero de FinanzasApp. Respondé en español de forma clara y breve.

Fecha actual: {today}. El mes actual es {month}.

Reglas:
- Usá ÚNICAMENTE la información del contexto y del historial de conversación. Nunca inventes montos, fechas, categorías ni nombres.
- Copiá los montos exactamente como aparecen en el contexto, sin redondear ni cambiar dígitos.
- Para preguntas de totales, comparaciones o "el mayor/menor gasto", priorizá los documentos que empiezan con "Resumen", "Gastos por categoría" o "Mayor gasto"; si no existen, calculá solo con los montos exactos del contexto.
- Antes de afirmar que un monto es mayor o menor que otro, citá ambos montos del contexto y verificá numéricamente tu conclusión.
- Si la pregunta refiere a algo mencionado antes en la conversación ("ese gasto", "esa categoría", "¿y en total?"), usá la conversación previa para interpretarla; los datos financieros salen siempre del contexto.
- Si el contexto contiene datos relacionados con la pregunta, respondé con ellos; reservá "no tengo información suficiente" únicamente para cuando ni el contexto ni la conversación previa mencionan nada relacionado.
- Los datos del contexto pertenecen exclusivamente al usuario que pregunta; no menciones otros usuarios.
- Cuando el contexto contenga documentos que comienzan con "Consejo financiero", úsalos como guía orientativa general. Los montos, fechas y datos específicos del usuario salen SOLO de los documentos que NO comienzan con "Consejo financiero".
- Cuando sea útil, resumí totales o comparaciones con los montos exactos del contexto."""


def _system_prompt() -> str:
    today = date.today()

    return SYSTEM_PROMPT.format(
        today=today.strftime("%d/%m/%Y"),
        month=f"{_MONTHS[today.month - 1]}/{today.year}",
    )


def create_llm():
    return ChatOllama(
        base_url=OLLAMA_HOST,
        model=OLLAMA_MODEL,
        temperature=0,
        num_ctx=4096,
    )


def format_history(history: list[dict]) -> str:
    if not history:
        return "(sin mensajes previos)"

    return "\n".join(
        f"{'Usuario' if turn['role'] == 'user' else 'Asistente'}: {turn['content']}"
        for turn in history
    )


def build_reply(question: str, documents: list[str], history=None, llm=None) -> str:
    model = llm or create_llm()
    context = "\n".join(f"- {document}" for document in documents) if documents else "(sin datos)"

    messages = [
        SystemMessage(content=_system_prompt()),
        HumanMessage(
            content=(
                f"Conversación previa:\n{format_history(history or [])}\n\n"
                f"Contexto del usuario:\n{context}\n\n"
                f"Pregunta: {question}"
            )
        ),
    ]

    response = model.invoke(messages)

    return getattr(response, "content", "").strip() or "No pude generar una respuesta."


ACTION_PROMPT = """Analizá el pedido del usuario de FinanzasApp. Si pide crear, editar, eliminar o ejecutar una acción, devolvé SOLO JSON con {\"action\": {\"type\": tipo, \"summary\": resumen en español, \"payload\": objeto}}. Si es una consulta, faltan datos o la referencia es ambigua, devolvé {\"action\": null}. Tipos permitidos: create_transaction, update_transaction, delete_transaction, create_category, update_category, delete_category, create_budget, update_budget, delete_budget, create_goal, update_goal, delete_goal, adjust_goal, mark_alert_read, mark_all_alerts_read, export_transactions.

Para create_transaction el payload debe ser {type: \"income\" o \"expense\", amount: entero positivo en centavos, date: \"AAAA-MM-DD\" opcional, category: texto opcional, description: texto opcional}. Para create_goal debe ser {name, targetAmount: entero positivo en centavos, savedAmount: entero no negativo en centavos opcional, deadline: \"AAAA-MM-DD\" opcional}. Para create_budget debe ser {category, month: \"AAAA-MM\", amount: entero positivo en centavos, threshold: entero 1-100 opcional}. Para crear categorías se requieren name, type y color de la paleta permitida. Nunca inventes identificadores ni datos faltantes."""

ACTION_TYPES = {
    "create_transaction", "update_transaction", "delete_transaction",
    "create_category", "update_category", "delete_category",
    "create_budget", "update_budget", "delete_budget",
    "create_goal", "update_goal", "delete_goal", "adjust_goal",
    "mark_alert_read", "mark_all_alerts_read", "export_transactions",
}

COLOR_NAMES = {
    "violeta": "#6366f1",
    "morado": "#8b5cf6",
    "amarillo": "#f59e0b",
    "rojo": "#ef4444",
    "verde": "#10b981",
    "azul": "#3b82f6",
    "rosa": "#ec4899",
    "turquesa": "#14b8a6",
    "naranja": "#f97316",
}


def _parse_amount(text: str) -> int | None:
    match = re.search(r"\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)", text)
    if not match:
        return None

    raw = match.group(1).replace(".", "").replace(",", ".")
    try:
        amount = round(float(raw) * 100)
    except ValueError:
        return None
    return amount if amount > 0 else None


def _deterministic_action(question: str) -> dict | None:
    normalized = question.lower().strip()
    is_create = bool(re.search(r"\b(creá|crea|crear|agregá|agrega|agregar|registrá|registra|registrar)\b", normalized))

    if is_create and "categor" in normalized:
        name_match = re.search(
            r"(?:llamada?|nombre)\s+[\"']?(.+?)[\"']?(?=\s+(?:color|que sea|de tipo|como)\b|[.!]?$)",
            normalized,
        )
        if not name_match:
            return None

        name = name_match.group(1).strip()
        category_type = "income" if any(word in normalized for word in ("ingreso", "sueldo")) else "expense"
        color = next((hex_color for label, hex_color in COLOR_NAMES.items() if label in normalized), None)
        if not color:
            return None
        return {
            "type": "create_category",
            "summary": f"Crear categoría {name.title()} de {'ingreso' if category_type == 'income' else 'gasto'}.",
            "payload": {"name": name.title(), "type": category_type, "color": color},
        }

    if is_create and ("gasto" in normalized or "ingreso" in normalized):
        amount = _parse_amount(normalized)
        if not amount:
            return None
        transaction_type = "expense" if "gasto" in normalized else "income"
        category_match = re.search(r"\ben\s+(.+?)(?=\s+(?:hoy|ayer)\b|[.!]?$)", normalized)
        category = category_match.group(1).strip().title() if category_match else None
        transaction_date = date.today()
        if "ayer" in normalized:
            from datetime import timedelta
            transaction_date -= timedelta(days=1)
        return {
            "type": "create_transaction",
            "summary": f"Registrar {'un gasto' if transaction_type == 'expense' else 'un ingreso'} de ${amount / 100:,.2f}" + (f" en {category}" if category else "") + ".",
            "payload": {
                "type": transaction_type,
                "amount": amount,
                "date": transaction_date.isoformat(),
                "category": category,
            },
        }

    return None


def interpret_action(question: str, llm=None) -> dict | None:
    deterministic = _deterministic_action(question)
    if deterministic:
        return deterministic

    model = llm or create_llm()
    response = model.invoke([SystemMessage(content=ACTION_PROMPT), HumanMessage(content=question)])
    raw = getattr(response, "content", "").strip()
    try:
        parsed = json.loads(raw.removeprefix("```json").removesuffix("```").strip())
    except (TypeError, ValueError):
        return None
    action = parsed.get("action") if isinstance(parsed, dict) else None
    if not isinstance(action, dict) or action.get("type") not in ACTION_TYPES:
        return None
    if not isinstance(action.get("summary"), str) or not isinstance(action.get("payload"), dict):
        return None
    return action
