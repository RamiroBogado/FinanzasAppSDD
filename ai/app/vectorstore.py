import math
from abc import ABC, abstractmethod

from app import config


class VectorStoreProvider(ABC):
    @abstractmethod
    def add(self, document_id: str, content: str, embedding: list[float]) -> None:
        pass

    @abstractmethod
    def query(self, embedding: list[float], limit: int = 5) -> list[str]:
        pass

    @abstractmethod
    def clear(self) -> None:
        pass


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0

    dot_product = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))

    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0

    return dot_product / (left_norm * right_norm)


class InMemoryVectorStore(VectorStoreProvider):
    def __init__(self) -> None:
        self._documents: list[tuple[str, str, list[float]]] = []

    def add(self, document_id: str, content: str, embedding: list[float]) -> None:
        self._documents.append((document_id, content, list(embedding)))

    def query(self, embedding: list[float], limit: int = 5) -> list[str]:
        ranked = sorted(
            self._documents,
            key=lambda document: cosine_similarity(embedding, document[2]),
            reverse=True,
        )

        return [content for _, content, _ in ranked[:limit]]

    def clear(self) -> None:
        self._documents.clear()


class ChromaVectorStore(VectorStoreProvider):
    def __init__(self, namespace: str) -> None:
        import chromadb
        from chromadb.config import Settings

        sanitized = "".join(
            character if character.isalnum() or character in "-_" else "-"
            for character in namespace
        )
        collection_name = f"finanzas-{sanitized}"

        if not collection_name[0].isalnum():
            collection_name = f"c{collection_name}"

        self._client = chromadb.PersistentClient(
            path=config.CHROMA_PATH,
            settings=Settings(anonymized_telemetry=False, allow_reset=True),
        )
        self._collection = self._client.get_or_create_collection(collection_name)

    def get_metadata(self, key: str):
        metadata = self._collection.metadata or {}
        return metadata.get(key)

    def set_metadata(self, entries: dict) -> None:
        self._collection.modify(metadata=entries)

    def count(self) -> int:
        return self._collection.count()

    def add(self, document_id: str, content: str, embedding: list[float]) -> None:
        self._collection.upsert(
            ids=[document_id],
            documents=[content],
            embeddings=[list(embedding)],
        )

    def query(self, embedding: list[float], limit: int = 5) -> list[str]:
        if self._collection.count() == 0:
            return []

        result = self._collection.query(
            query_embeddings=[list(embedding)],
            n_results=min(limit, self._collection.count()),
        )

        return [content for content in result["documents"][0]]

    def clear(self) -> None:
        self._client.delete_collection(self._collection.name)
        self._collection = self._client.get_or_create_collection(
            self._collection.name
        )


def create_vector_store(namespace: str) -> VectorStoreProvider:
    if config.VECTOR_STORE == "chroma":
        return ChromaVectorStore(namespace)

    if config.VECTOR_STORE == "memory":
        return InMemoryVectorStore()

    raise ValueError(f"Proveedor de almacén vectorial no soportado: {config.VECTOR_STORE}")
