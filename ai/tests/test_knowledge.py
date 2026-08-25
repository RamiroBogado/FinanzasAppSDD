import os
import tempfile
import shutil

from app.knowledge import (
    KnowledgeIndex,
    build_knowledge_documents,
    get_fingerprint,
)


KNOWLEDGE_CONTENT = """# Presupuesto Personal

## Regla 50/30/20

Una forma sencilla de dividir tus ingresos:
- **50%** para necesidades.
- **30%** para deseos.
- **20%** para ahorro.

## Categorizar tus gastos

Separá tus gastos en categorías fijos y variables.
"""

KNOWLEDGE_CONTENT_UPDATED = """# Ahorro

## Metas SMART

Poné metas específicas, medibles, alcanzables, relevantes y con fecha límite.
"""


class StubVectorStore:
    def __init__(self, namespace: str = "") -> None:
        self.namespace = namespace
        self.documents: list[tuple[str, str]] = []
        self.cleared = False
        self.metadata: dict = {}

    def add(self, document_id: str, content: str, embedding: list[float]) -> None:
        self.documents.append((document_id, content))

    def query(self, embedding: list[float], limit: int = 5) -> list[str]:
        return [content for _, content in self.documents[:limit]]

    def clear(self) -> None:
        self.documents.clear()
        self.cleared = True

    def get_metadata(self, key: str):
        return self.metadata.get(key)

    def set_metadata(self, entries: dict) -> None:
        self.metadata.update(entries)


def stub_embedder(text: str) -> list[float]:
    return [0.1] * 10


def make_temp_knowledge_dir():
    tmpdir = tempfile.mkdtemp()
    filepath = os.path.join(tmpdir, "presupuesto.md")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(KNOWLEDGE_CONTENT)
    return tmpdir, filepath


def make_empty_knowledge_dir():
    tmpdir = tempfile.mkdtemp()
    return tmpdir


def test_build_knowledge_documents_splits_by_heading():
    tmpdir, _ = make_temp_knowledge_dir()

    try:
        documents = build_knowledge_documents(tmpdir)

        assert len(documents) == 3
        assert documents[0].startswith("Consejo financiero (presupuesto):")
        assert documents[1].startswith("Consejo financiero (Regla 50/30/20):")
        assert documents[2].startswith("Consejo financiero (Categorizar tus gastos):")
        assert "50%" in documents[1]
        assert "fijos y variables" in documents[2]
    finally:
        shutil.rmtree(tmpdir)


def test_build_knowledge_documents_empty_dir():
    tmpdir = make_empty_knowledge_dir()

    try:
        documents = build_knowledge_documents(tmpdir)
        assert documents == []
    finally:
        shutil.rmtree(tmpdir)


def test_build_knowledge_documents_nonexistent_dir():
    documents = build_knowledge_documents("/nonexistent/path/that/does/not/exist")
    assert documents == []


def test_fingerprint_changes_with_content():
    tmpdir, filepath = make_temp_knowledge_dir()

    try:
        fp1 = get_fingerprint(tmpdir)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(KNOWLEDGE_CONTENT_UPDATED)

        fp2 = get_fingerprint(tmpdir)

        assert fp1 != fp2
    finally:
        shutil.rmtree(tmpdir)


def test_fingerprint_empty_dir():
    tmpdir = make_empty_knowledge_dir()

    try:
        fp = get_fingerprint(tmpdir)
        assert fp == ("empty", 0)
    finally:
        shutil.rmtree(tmpdir)


def test_knowledge_index_retrieves_documents():
    tmpdir, _ = make_temp_knowledge_dir()

    try:
        stub_store = StubVectorStore()
        index = KnowledgeIndex(
            knowledge_dir=tmpdir,
            store_factory=lambda ns: stub_store,
        )

        documents = index.retrieve("¿cómo hago un presupuesto?", limit=2)

        assert len(documents) == 2
        assert "Consejo financiero" in documents[0]
    finally:
        shutil.rmtree(tmpdir)


def test_knowledge_index_caches_fingerprint():
    tmpdir, filepath = make_temp_knowledge_dir()

    try:
        call_count = [0]
        original_add = StubVectorStore.add

        def counting_add(self, document_id, content, embedding):
            call_count[0] += 1
            original_add(self, document_id, content, embedding)

        StubVectorStore.add = counting_add

        try:
            stub_store = StubVectorStore()
            index = KnowledgeIndex(
                knowledge_dir=tmpdir,
                store_factory=lambda ns: stub_store,
            )

            index.retrieve("test")
            first_count = call_count[0]

            index.retrieve("test")
            second_count = call_count[0]

            assert first_count == second_count
        finally:
            StubVectorStore.add = original_add
    finally:
        shutil.rmtree(tmpdir)


def test_knowledge_index_rebuilds_on_fingerprint_change():
    tmpdir, filepath = make_temp_knowledge_dir()

    try:
        stub_store = StubVectorStore()
        index = KnowledgeIndex(
            knowledge_dir=tmpdir,
            store_factory=lambda ns: stub_store,
        )

        index.retrieve("test")
        assert len(stub_store.documents) == 3

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(KNOWLEDGE_CONTENT_UPDATED)

        index.retrieve("test")
        assert len(stub_store.documents) == 2
        assert any("Metas SMART" in doc[1] for doc in stub_store.documents)
    finally:
        shutil.rmtree(tmpdir)


def test_knowledge_index_clear():
    tmpdir, _ = make_temp_knowledge_dir()

    try:
        stub_store = StubVectorStore()
        index = KnowledgeIndex(
            knowledge_dir=tmpdir,
            store_factory=lambda ns: stub_store,
        )

        index.retrieve("test")
        assert len(stub_store.documents) == 3

        index.clear()
        assert stub_store.cleared
        assert index._fingerprint is None
    finally:
        shutil.rmtree(tmpdir)


def test_knowledge_index_empty_dir():
    tmpdir = make_empty_knowledge_dir()

    try:
        stub_store = StubVectorStore()
        index = KnowledgeIndex(
            knowledge_dir=tmpdir,
            store_factory=lambda ns: stub_store,
        )

        documents = index.retrieve("test")
        assert documents == []
    finally:
        shutil.rmtree(tmpdir)


def test_knowledge_index_respects_limit():
    tmpdir, _ = make_temp_knowledge_dir()

    try:
        stub_store = StubVectorStore()
        index = KnowledgeIndex(
            knowledge_dir=tmpdir,
            store_factory=lambda ns: stub_store,
        )

        documents = index.retrieve("test", limit=1)
        assert len(documents) == 1
    finally:
        shutil.rmtree(tmpdir)


def test_retrieve_combined_merges_user_and_knowledge(monkeypatch, tmp_path):
    from app.indexer import retrieve_combined
    from app.knowledge import KnowledgeIndex
    from app import config

    monkeypatch.setattr(config, "RETRIEVAL_LIMIT", 8)
    monkeypatch.setattr(config, "KNOWLEDGE_LIMIT", 4)

    class StubUserIndex:
        def retrieve(self, user_id, question, limit=8):
            return [f"user-doc-{user_id}"] * min(limit, 2)

    monkeypatch.setattr("app.indexer.user_index", StubUserIndex())

    knowledge_dir = str(tmp_path / "knowledge")
    os.makedirs(knowledge_dir)
    with open(os.path.join(knowledge_dir, "test.md"), "w", encoding="utf-8") as f:
        f.write(KNOWLEDGE_CONTENT)

    stub_store = StubVectorStore()
    knowledge_idx = KnowledgeIndex(
        knowledge_dir=knowledge_dir,
        store_factory=lambda ns: stub_store,
    )
    monkeypatch.setattr("app.knowledge.knowledge_index", knowledge_idx)

    docs = retrieve_combined(1, "test question")

    user_docs = [d for d in docs if d.startswith("user-doc-")]
    knowledge_docs = [d for d in docs if d.startswith("Consejo financiero")]

    assert len(user_docs) == 2
    assert len(knowledge_docs) == 3
    assert len(docs) == 5
