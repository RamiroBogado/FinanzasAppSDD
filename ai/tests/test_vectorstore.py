from app.vectorstore import InMemoryVectorStore, VectorStoreProvider


def test_in_memory_vector_store_is_testable():
    store = InMemoryVectorStore()
    assert isinstance(store, VectorStoreProvider)

    store.add("doc-1", "Ingreso de julio")
    store.add("doc-2", "Gasto de supermercado")

    results = store.query("consulta", limit=1)
    assert results == ["Ingreso de julio"]

    store.clear()
    assert store.query("consulta") == []