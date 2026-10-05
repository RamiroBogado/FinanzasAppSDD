from datetime import date, timedelta

from langchain_core.messages import HumanMessage, SystemMessage

from app.chat import _deterministic_action, _parse_amount, build_reply, format_history


class FakeResponse:
    def __init__(self, content: str) -> None:
        self.content = content


class FakeLLM:
    def __init__(self) -> None:
        self.messages = None

    def invoke(self, messages):
        self.messages = messages

        return FakeResponse("  Respuesta simulada.  ")


def test_format_history_renders_turns_in_order():
    history = [
        {"role": "user", "content": "¿Cuánto gasté en comida?"},
        {"role": "assistant", "content": "Gastaste $450,00"},
    ]

    rendered = format_history(history)

    assert rendered == "Usuario: ¿Cuánto gasté en comida?\nAsistente: Gastaste $450,00"


def test_format_history_empty_returns_placeholder():
    assert format_history([]) == "(sin mensajes previos)"
    assert format_history(None) == "(sin mensajes previos)"


def test_build_reply_includes_history_context_and_question():
    llm = FakeLLM()

    reply = build_reply(
        "¿y en total?",
        ["Gasto: Comida $450,00"],
        history=[{"role": "user", "content": "¿Cuánto gasté en comida?"}],
        llm=llm,
    )

    assert reply == "Respuesta simulada."
    assert len(llm.messages) == 2
    assert isinstance(llm.messages[0], SystemMessage)
    human = llm.messages[1]

    assert isinstance(human, HumanMessage)
    assert "Usuario: ¿Cuánto gasté en comida?" in human.content
    assert "- Gasto: Comida $450,00" in human.content
    assert "Pregunta: ¿y en total?" in human.content


def test_build_reply_without_history_and_documents():
    llm = FakeLLM()

    build_reply("hola", [], llm=llm)

    content = llm.messages[1].content

    assert "(sin mensajes previos)" in content
    assert "(sin datos)" in content


def test_parse_amount_simple_integer():
    assert _parse_amount("gasto 450") == 45000


def test_parse_amount_with_dollar_and_decimals():
    assert _parse_amount("$450,00") == 45000
    assert _parse_amount("$1.234,56") == 123456


def test_parse_amount_thousands_with_dot():
    assert _parse_amount("1.234") == 123400


def test_parse_amount_invalid_returns_none():
    assert _parse_amount("sin numeros") is None


def test_parse_amount_zero_returns_none():
    assert _parse_amount("gasto 0") is None


def test_deterministic_action_create_category_expense():
    action = _deterministic_action("Crea una categoria llamada Comida color rojo")

    assert action is not None
    assert action["type"] == "create_category"
    assert action["payload"] == {"name": "Comida", "type": "expense", "color": "#ef4444"}


def test_deterministic_action_create_category_income():
    action = _deterministic_action("Agrega una categoria con nombre Sueldo de tipo ingreso color verde")

    assert action is not None
    assert action["type"] == "create_category"
    assert action["payload"] == {"name": "Sueldo", "type": "income", "color": "#10b981"}


def test_deterministic_action_create_category_without_color_returns_none():
    assert _deterministic_action("Crea una categoria llamada Comida") is None


def test_deterministic_action_create_category_without_name_returns_none():
    assert _deterministic_action("Crea una categoria de color rojo") is None


def test_deterministic_action_create_transaction_expense():
    action = _deterministic_action("Registra un gasto de $450 en comida")

    assert action is not None
    assert action["type"] == "create_transaction"
    assert action["payload"]["type"] == "expense"
    assert action["payload"]["amount"] == 45000
    assert action["payload"]["category"] == "Comida"
    assert action["payload"]["date"] == date.today().isoformat()


def test_deterministic_action_create_transaction_income_without_category():
    action = _deterministic_action("Agrega un ingreso de 1200")

    assert action is not None
    assert action["type"] == "create_transaction"
    assert action["payload"]["type"] == "income"
    assert action["payload"]["amount"] == 120000
    assert action["payload"]["category"] is None


def test_deterministic_action_create_transaction_yesterday():
    action = _deterministic_action("Registra un gasto de 500 ayer")

    assert action is not None
    assert action["payload"]["date"] == (date.today() - timedelta(days=1)).isoformat()


def test_deterministic_action_create_transaction_without_amount_returns_none():
    assert _deterministic_action("Registra un gasto en comida") is None


def test_deterministic_action_query_returns_none():
    assert _deterministic_action("Cuanto gaste en comida?") is None
    assert _deterministic_action("hola") is None
