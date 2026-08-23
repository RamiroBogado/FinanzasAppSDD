import zlib

import jwt
import pytest
from fastapi.testclient import TestClient

from app.indexer import UserIndex
from app.main import app

client = TestClient(app)

SECRET = "finanzasapp-dev-secret"


def auth_header(user_id: int = 1) -> dict:
    token = jwt.encode({"sub": str(user_id)}, SECRET, algorithm="HS256")

    return {"Authorization": f"Bearer {token}"}


class StubIndex:
    def __init__(self) -> None:
        self.calls: list[tuple[int, str]] = []
        self.cleared: list[int] = []

    def retrieve(self, user_id: int, question: str, limit: int = 8) -> list[str]:
        self.calls.append((user_id, question))

        return [f"Transacción de {user_id}"]

    def clear(self, user_id: int) -> None:
        self.cleared.append(user_id)


@pytest.fixture()
def stub_index(monkeypatch):
    stub = StubIndex()
    monkeypatch.setattr("app.main.user_index", stub)

    return stub


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_message_requires_authorization():
    response = client.post("/ai/chatbot/message", json={"message": "Hola"})

    assert response.status_code == 401
    assert response.json() == {"error": "No autorizado"}


def test_message_rejects_invalid_token():
    response = client.post(
        "/ai/chatbot/message",
        json={"message": "Hola"},
        headers={"Authorization": "Bearer no-es-un-token"},
    )

    assert response.status_code == 401
    assert response.json() == {"error": "Token inválido o expirado"}


def test_message_requires_message_field(stub_index):
    response = client.post("/ai/chatbot/message", json={}, headers=auth_header())

    assert response.status_code == 400
    assert response.json() == {"error": "El mensaje es obligatorio"}


@pytest.mark.parametrize("message", ["", "   "])
def test_message_rejects_blank_message(stub_index, message):
    response = client.post(
        "/ai/chatbot/message",
        json={"message": message},
        headers=auth_header(),
    )

    assert response.status_code == 400
    assert response.json() == {"error": "El mensaje no puede estar vacío"}


def test_message_returns_reply_from_context(stub_index, monkeypatch):
    monkeypatch.setattr(
        "app.main.build_reply",
        lambda question, documents: f"respuesta:{question}:{documents[0]}",
    )

    response = client.post(
        "/ai/chatbot/message",
        json={"message": "  ¿Cuánto gasté?  "},
        headers=auth_header(user_id=7),
    )

    assert response.status_code == 200
    assert response.json() == {"reply": "respuesta:¿Cuánto gasté?:Transacción de 7"}
    assert stub_index.calls == [(7, "¿Cuánto gasté?")]


def test_clear_resets_user_context(stub_index):
    response = client.post("/ai/chatbot/clear", headers=auth_header(user_id=3))

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert stub_index.cleared == [3]


def test_system_prompt_includes_current_date():
    from datetime import date

    from app.chat import _system_prompt

    prompt = _system_prompt()

    assert date.today().strftime("%d/%m/%Y") in prompt
    assert "{today}" not in prompt
    assert "{month}" not in prompt
    assert "respondé con ellos" in prompt
    assert "reservá" in prompt


class FakeDataProvider:
    def __init__(self) -> None:
        self.docs: dict[int, list[str]] = {}
        self.fingerprints: dict[int, tuple] = {}

    def build_documents(self, user_id: int) -> list[str]:
        return list(self.docs.get(user_id, []))

    def get_fingerprint(self, user_id: int) -> tuple:
        return self.fingerprints.get(user_id, (0,))


def fake_embed(text: str) -> list[float]:
    vector = [0.0] * 64
    vector[zlib.crc32(text.encode()) % 64] = 1.0

    return vector


def make_index(provider: FakeDataProvider) -> UserIndex:
    return UserIndex(embedder=fake_embed, data_provider=provider)


def test_retrieve_only_returns_own_user_documents():
    provider = FakeDataProvider()
    provider.docs = {1: ["Transacción A"], 2: ["Transacción B"]}
    provider.fingerprints = {1: (1,), 2: (1,)}

    index = make_index(provider)

    assert index.retrieve(1, "Transacción A") == ["Transacción A"]
    assert index.retrieve(2, "Transacción B") == ["Transacción B"]
    assert index.retrieve(1, "Transacción B") != ["Transacción B"]


def test_retrieve_rebuilds_when_fingerprint_changes():
    provider = FakeDataProvider()
    provider.docs = {1: ["Meta vieja"]}
    provider.fingerprints = {1: (1,)}

    index = make_index(provider)

    assert index.retrieve(1, "Meta vieja") == ["Meta vieja"]

    provider.docs = {1: ["Meta vieja", "Meta nueva"]}
    provider.fingerprints = {1: (2,)}

    assert index.retrieve(1, "Meta nueva", limit=1) == ["Meta nueva"]


def test_clear_forces_rebuild_with_empty_data():
    provider = FakeDataProvider()
    provider.docs = {1: ["Dato"]}
    provider.fingerprints = {1: (1,)}

    index = make_index(provider)
    assert index.retrieve(1, "Dato") == ["Dato"]

    index.clear(1)

    provider.docs = {1: []}
    provider.fingerprints = {1: (2,)}

    assert index.retrieve(1, "Dato") == []
