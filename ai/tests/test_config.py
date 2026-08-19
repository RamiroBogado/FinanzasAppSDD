from app.config import EMBEDDING_MODEL, OLLAMA_HOST, OLLAMA_MODEL


def test_ollama_configuration_prepared():
    assert OLLAMA_HOST == "http://localhost:11434"
    assert OLLAMA_MODEL == "llama3.2"
    assert EMBEDDING_MODEL == "nomic-embed-text"