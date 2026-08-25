from langchain_core.messages import HumanMessage, SystemMessage

from app.chat import build_reply, format_history


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
