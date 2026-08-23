import threading

from app import data
from app.config import EMBEDDING_MODEL, OLLAMA_HOST, RETRIEVAL_LIMIT
from app.vectorstore import InMemoryVectorStore


def _format_amount(cents: int) -> str:
    return f"${cents / 100:,.2f}"


def _format_date(iso_date: str) -> str:
    if not iso_date:
        return "sin fecha"

    year, month, day = iso_date.split("-")
    return f"{day}/{month}/{year}"


def _monthly_stats(transactions: list[dict]) -> dict[str, dict]:
    stats: dict[str, dict] = {}

    for transaction in transactions:
        month = transaction["date"][:7]
        summary = stats.setdefault(
            month, {"income": 0, "expense": 0, "categories": {}, "top": None}
        )

        if transaction["type"] == "income":
            summary["income"] += transaction["amount"]
            continue

        summary["expense"] += transaction["amount"]
        category = transaction["category"] or "sin categoría"
        summary["categories"][category] = (
            summary["categories"].get(category, 0) + transaction["amount"]
        )

        if summary["top"] is None or transaction["amount"] > summary["top"][1]:
            summary["top"] = (transaction, transaction["amount"])

    return stats


def build_documents(user_id: int) -> list[str]:
    transactions = data.get_transactions(user_id)
    documents = []

    for transaction in transactions:
        kind = "Ingreso" if transaction["type"] == "income" else "Gasto"
        category = transaction["category"] or "sin categoría"
        description = transaction["description"] or ""
        documents.append(
            f"Transacción del {_format_date(transaction['date'])}: "
            f"{kind} de {_format_amount(transaction['amount'])} en {category}"
            + (f" ({description})" if description else "")
        )

    for month, summary in sorted(_monthly_stats(transactions).items(), reverse=True):
        year, month_number = month.split("-")
        documents.append(
            f"Resumen de {month_number}/{year}: "
            f"ingresos {_format_amount(summary['income'])}, "
            f"gastos {_format_amount(summary['expense'])}"
        )

        if summary["categories"]:
            ranked = sorted(summary["categories"].items(), key=lambda item: -item[1])
            parts = [
                f"{category} {_format_amount(total)}"
                + (" (mayor gasto)" if index == 0 else "")
                for index, (category, total) in enumerate(ranked)
            ]
            documents.append(
                f"Gastos por categoría en {month_number}/{year}: " + ", ".join(parts)
            )

        if summary["top"] is not None:
            top_transaction, top_amount = summary["top"]
            documents.append(
                f"Mayor gasto de {month_number}/{year}: "
                f"{_format_date(top_transaction['date'])} "
                f"{_format_amount(top_amount)} en "
                f"{top_transaction['category'] or 'sin categoría'}"
                + (f" ({top_transaction['description']})" if top_transaction["description"] else "")
            )

    for budget in data.get_budgets(user_id):
        year, month = budget["month"].split("-")
        documents.append(
            f"Presupuesto de {budget['category']} para {month}/{year}: "
            f"límite {_format_amount(budget['amount'])}, "
            f"gastado {_format_amount(budget['spent'])}"
        )

    for goal in data.get_goals(user_id):
        deadline = (
            f", fecha límite {_format_date(goal['deadline'])}" if goal["deadline"] else ""
        )
        documents.append(
            f"Meta de ahorro {goal['name']}: objetivo {_format_amount(goal['target_amount'])}, "
            f"ahorrado {_format_amount(goal['saved_amount'])}{deadline}"
        )

    return documents


def create_embedder():
    from langchain_ollama import OllamaEmbeddings

    embeddings = OllamaEmbeddings(base_url=OLLAMA_HOST, model=EMBEDDING_MODEL)
    return embeddings.embed_query


class SqliteDataProvider:
    @staticmethod
    def build_documents(user_id: int) -> list[str]:
        return build_documents(user_id)

    @staticmethod
    def get_fingerprint(user_id: int) -> tuple:
        return data.get_fingerprint(user_id)


class UserIndex:
    def __init__(self, embedder=None, data_provider=None) -> None:
        self._embedder = embedder
        self._data_provider = data_provider or SqliteDataProvider()
        self._stores: dict[int, InMemoryVectorStore] = {}
        self._fingerprints: dict[int, tuple] = {}
        self._lock = threading.Lock()

    def _embed(self, text: str) -> list[float]:
        if self._embedder is None:
            self._embedder = create_embedder()

        return self._embedder(text)

    def _rebuild(self, user_id: int) -> InMemoryVectorStore:
        store = InMemoryVectorStore()

        for index, document in enumerate(self._data_provider.build_documents(user_id)):
            store.add(f"{user_id}-{index}", document, self._embed(document))

        return store

    def retrieve(self, user_id: int, question: str, limit: int = RETRIEVAL_LIMIT) -> list[str]:
        with self._lock:
            fingerprint = self._data_provider.get_fingerprint(user_id)

            if user_id not in self._stores or self._fingerprints.get(user_id) != fingerprint:
                self._stores[user_id] = self._rebuild(user_id)
                self._fingerprints[user_id] = fingerprint

            store = self._stores[user_id]

        return store.query(self._embed(question), limit)

    def clear(self, user_id: int) -> None:
        with self._lock:
            self._stores.pop(user_id, None)
            self._fingerprints.pop(user_id, None)


user_index = UserIndex()
