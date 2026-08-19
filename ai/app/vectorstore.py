from abc import ABC, abstractmethod


class VectorStoreProvider(ABC):
    @abstractmethod
    def add(self, document_id: str, content: str) -> None:
        pass

    @abstractmethod
    def query(self, text: str, limit: int = 5) -> list[str]:
        pass

    @abstractmethod
    def clear(self) -> None:
        pass


class InMemoryVectorStore(VectorStoreProvider):
    def __init__(self) -> None:
        self._documents: list[tuple[str, str]] = []

    def add(self, document_id: str, content: str) -> None:
        self._documents.append((document_id, content))

    def query(self, text: str, limit: int = 5) -> list[str]:
        return [content for _, content in self._documents[:limit]]

    def clear(self) -> None:
        self._documents.clear()