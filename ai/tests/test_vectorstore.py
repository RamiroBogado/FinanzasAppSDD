import math

import pytest

from app import config
from app.vectorstore import (
    ChromaVectorStore,
    InMemoryVectorStore,
    VectorStoreProvider,
    cosine_similarity,
    create_vector_store,
)


@pytest.fixture()
def chroma_path(monkeypatch, tmp_path):
    monkeypatch.setattr(config, "CHROMA_PATH", str(tmp_path / "chroma"))

    return str(tmp_path / "chroma")


def test_in_memory_vector_store_is_testable():
    store = InMemoryVectorStore()
    assert isinstance(store, VectorStoreProvider)

    store.add("doc-1", "Ingreso de julio", [1.0, 0.0])
    store.add("doc-2", "Gasto de supermercado", [0.0, 1.0])

    results = store.query([1.0, 0.0], limit=1)
    assert results == ["Ingreso de julio"]

    store.clear()
    assert store.query([1.0, 0.0]) == []


def test_cosine_similarity_ranks_by_angle():
    store = InMemoryVectorStore()
    store.add("a", "documento a", [2.0, 0.0])
    store.add("b", "documento b", [1.0, 1.0])
    store.add("c", "documento c", [0.0, 3.0])

    assert store.query([2.0, 0.5], limit=3) == [
        "documento a",
        "documento b",
        "documento c",
    ]


def test_cosine_similarity_handles_zero_and_mismatched_vectors():
    assert cosine_similarity([], [1.0]) == 0.0
    assert cosine_similarity([0.0, 0.0], [1.0, 0.0]) == 0.0
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0
    assert math.isclose(cosine_similarity([1.0, 1.0], [-1.0, -1.0]), -1.0)


class TestChromaVectorStore:
    def test_implements_provider_contract(self, chroma_path):
        store = ChromaVectorStore("user-1")

        assert isinstance(store, VectorStoreProvider)

        store.add("1-0", "Ingreso de julio", [1.0, 0.0])
        store.add("1-1", "Gasto de supermercado", [0.0, 1.0])

        assert store.query([1.0, 0.0], limit=1) == ["Ingreso de julio"]

    def test_upsert_is_idempotent(self, chroma_path):
        store = ChromaVectorStore("user-1")
        store.add("1-0", "versión vieja", [1.0, 0.0])
        store.add("1-0", "versión nueva", [1.0, 0.0])

        assert store.count() == 1
        assert store.query([1.0, 0.0]) == ["versión nueva"]

    def test_clear_removes_all_documents(self, chroma_path):
        store = ChromaVectorStore("user-1")
        store.add("1-0", "documento", [1.0, 0.0])

        store.clear()

        assert store.count() == 0
        assert store.query([1.0, 0.0]) == []

    def test_query_on_empty_store_returns_empty_list(self, chroma_path):
        store = ChromaVectorStore("user-1")

        assert store.query([1.0, 0.0]) == []

    def test_persists_between_instances(self, chroma_path):
        first = ChromaVectorStore("user-9")
        first.add("9-0", "Meta de ahorro vacaciones", [1.0, 0.0])

        second = ChromaVectorStore("user-9")

        assert second.count() == 1
        assert second.query([1.0, 0.0]) == ["Meta de ahorro vacaciones"]

    def test_namespaces_are_isolated(self, chroma_path):
        first = ChromaVectorStore("user-1")
        second = ChromaVectorStore("user-2")

        first.add("1-0", "Dato del usuario uno", [1.0, 0.0])
        second.add("2-0", "Dato del usuario dos", [1.0, 0.0])

        assert second.query([1.0, 0.0]) == ["Dato del usuario dos"]
        assert "usuario uno" not in " ".join(second.query([1.0, 0.0], limit=10))

    def test_fingerprint_metadata_roundtrip(self, chroma_path):
        store = ChromaVectorStore("user-3")

        assert store.get_metadata("fingerprint") is None

        store.set_metadata({"fingerprint": "[1, 2, 3]"})

        reloaded = ChromaVectorStore("user-3")

        assert reloaded.get_metadata("fingerprint") == "[1, 2, 3]"


class TestCreateVectorStore:
    def test_memory_is_the_default(self, monkeypatch):
        monkeypatch.setattr(config, "VECTOR_STORE", "memory")

        assert isinstance(create_vector_store("user-1"), InMemoryVectorStore)

    def test_chroma_when_configured(self, monkeypatch, chroma_path):
        monkeypatch.setattr(config, "VECTOR_STORE", "chroma")

        assert isinstance(create_vector_store("user-1"), ChromaVectorStore)

    def test_rejects_unknown_provider(self, monkeypatch):
        monkeypatch.setattr(config, "VECTOR_STORE", "redis")

        with pytest.raises(ValueError):
            create_vector_store("user-1")
