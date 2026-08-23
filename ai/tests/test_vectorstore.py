import math

from app.vectorstore import InMemoryVectorStore, VectorStoreProvider, cosine_similarity


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
