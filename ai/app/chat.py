from datetime import date

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
