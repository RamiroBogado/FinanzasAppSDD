import os

from app.config import DB_PATH, EMBEDDING_MODEL, JWT_SECRET, OLLAMA_HOST, OLLAMA_MODEL


def test_ollama_configuration_prepared():
    assert OLLAMA_HOST == "http://localhost:11434"
    assert OLLAMA_MODEL == "llama3.1:8b"
    assert EMBEDDING_MODEL == "nomic-embed-text"


def test_auth_and_database_configuration_prepared():
    assert isinstance(JWT_SECRET, str) and JWT_SECRET
    assert isinstance(DB_PATH, str) and DB_PATH.endswith("finanzas.db")


def test_environment_overrides_are_honored(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    monkeypatch.setenv("DB_PATH", "/tmp/test.db")

    import importlib

    from app import config

    importlib.reload(config)

    assert config.JWT_SECRET == "test-secret"
    assert config.DB_PATH == "/tmp/test.db"

    monkeypatch.delenv("JWT_SECRET")
    monkeypatch.delenv("DB_PATH")
    monkeypatch.delenv("OLLAMA_HOST", raising=False)

    importlib.reload(config)
