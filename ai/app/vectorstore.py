import math
from abc import ABC, abstractmethod


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
