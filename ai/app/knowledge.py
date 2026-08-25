import hashlib
import os
import threading

from app.config import KNOWLEDGE_DIR, KNOWLEDGE_LIMIT
from app.vectorstore import VectorStoreProvider, create_vector_store


def _read_knowledge_files(knowledge_dir: str) -> list[tuple[str, str]]:
    if not os.path.isdir(knowledge_dir):
        return []

    documents = []
    for filename in sorted(os.listdir(knowledge_dir)):
        if not filename.endswith(".md"):
            continue

        filepath = os.path.join(knowledge_dir, filename)
        if not os.path.isfile(filepath):
            continue

        with open(filepath, encoding="utf-8") as f:
            content = f.read()

        documents.append((filename, content))

    return documents


def build_knowledge_documents(knowledge_dir: str) -> list[str]:
    documents = []
    for filename, content in _read_knowledge_files(knowledge_dir):
        topic = os.path.splitext(filename)[0]
        sections = []
        current_heading = topic
        current_lines = []

        for line in content.split("\n"):
            if line.startswith("## "):
                if current_lines:
                    sections.append((current_heading, "\n".join(current_lines).strip()))
                current_heading = line[3:].strip()
                current_lines = []
            else:
                current_lines.append(line)

        if current_lines:
            sections.append((current_heading, "\n".join(current_lines).strip()))

        if not sections:
            sections = [(topic, content.strip())]

        for heading, body in sections:
            if not body:
                continue
            documents.append(f"Consejo financiero ({heading}): {body}")

    return documents


def get_fingerprint(knowledge_dir: str) -> tuple[str, int]:
    files = _read_knowledge_files(knowledge_dir)
    if not files:
        return ("empty", 0)

    hasher = hashlib.sha256()
    for filename, content in files:
        hasher.update(filename.encode("utf-8"))
        hasher.update(content.encode("utf-8"))

    return (hasher.hexdigest(), len(files))


class KnowledgeIndex:
    def __init__(self, knowledge_dir: str = None, store_factory=None) -> None:
        self._knowledge_dir = knowledge_dir or KNOWLEDGE_DIR
        self._store_factory = store_factory or create_vector_store
        self._store: VectorStoreProvider | None = None
        self._fingerprint: tuple[str, int] | None = None
        self._lock = threading.Lock()

    @staticmethod
    def _namespace() -> str:
        return "knowledge"

    def _persisted_fingerprint(self) -> tuple[str, int] | None:
        from app.vectorstore import ChromaVectorStore

        if self._store is None or not isinstance(self._store, ChromaVectorStore):
            return None

        raw = self._store.get_metadata("fingerprint")
        if raw is None:
            return None

        try:
            import json
            data = json.loads(raw)
            return (data[0], data[1])
        except (TypeError, ValueError, KeyError):
            return None

    def _remember_fingerprint(self, fingerprint: tuple[str, int]) -> None:
        self._fingerprint = fingerprint
        from app.vectorstore import ChromaVectorStore

        if self._store is not None and isinstance(self._store, ChromaVectorStore):
            import json
            self._store.set_metadata({"fingerprint": json.dumps(list(fingerprint))})

    def _ensure_store(self) -> None:
        if self._store is None:
            self._store = self._store_factory(self._namespace())

    def _ensure_indexed(self) -> None:
        self._ensure_store()
        fingerprint = get_fingerprint(self._knowledge_dir)

        if self._fingerprint is not None and self._fingerprint == fingerprint:
            return

        persisted = self._persisted_fingerprint()
        if persisted is not None and persisted == fingerprint:
            self._fingerprint = fingerprint
            return

        if persisted is not None or self._fingerprint is not None:
            self._store.clear()

        from app.indexer import create_embedder
        embedder = create_embedder()
        documents = build_knowledge_documents(self._knowledge_dir)

        for index, document in enumerate(documents):
            embedding = embedder(document)
            self._store.add(f"knowledge-{index}", document, embedding)

        self._remember_fingerprint(fingerprint)

    def retrieve(self, question: str, limit: int = None) -> list[str]:
        limit = limit or KNOWLEDGE_LIMIT

        with self._lock:
            self._ensure_indexed()

            if self._store is None:
                return []

            from app.indexer import create_embedder
            embedder = create_embedder()

            return self._store.query(embedder(question), limit)

    def clear(self) -> None:
        with self._lock:
            self._ensure_store()
            if self._store is not None:
                self._store.clear()
            self._fingerprint = None


knowledge_index = KnowledgeIndex()
