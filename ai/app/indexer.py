import json
import threading

from app import data
from app.config import EMBEDDING_MODEL, OLLAMA_HOST, RETRIEVAL_LIMIT
from app.vectorstore import ChromaVectorStore, VectorStoreProvider, create_vector_store


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


def _build_overview(transactions: list[dict], budgets: list[dict], goals: list[dict]) -> str:
    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
    balance = total_income - total_expense

    parts = [
        f"Balance general: ingresos {_format_amount(total_income)}, "
        f"gastos {_format_amount(total_expense)}, saldo {_format_amount(balance)}"
    ]

    monthly = _monthly_stats(transactions)
    for month, summary in sorted(monthly.items(), reverse=True):
        year, month_number = month.split("-")
        parts.append(
            f"Resumen de {month_number}/{year}: "
            f"ingresos {_format_amount(summary['income'])}, "
            f"gastos {_format_amount(summary['expense'])}, "
            f"saldo {_format_amount(summary['income'] - summary['expense'])}"
        )

    for budget in budgets:
        year, month = budget["month"].split("-")
        parts.append(
            f"Presupuesto de {budget['category']} para {month}/{year}: "
            f"límite {_format_amount(budget['amount'])}, "
            f"gastado {_format_amount(budget['spent'])}"
        )

    for goal in goals:
        deadline = (
            f", fecha límite {_format_date(goal['deadline'])}" if goal["deadline"] else ""
        )
        parts.append(
            f"Meta de ahorro {goal['name']}: objetivo {_format_amount(goal['target_amount'])}, "
            f"ahorrado {_format_amount(goal['saved_amount'])}{deadline}"
        )

    return "Resumen financiero del usuario: " + "; ".join(parts)


def build_documents(user_id: int) -> list[str]:
    transactions = data.get_transactions(user_id)
    budgets = data.get_budgets(user_id)
    goals = data.get_goals(user_id)
    documents = []

    documents.append(_build_overview(transactions, budgets, goals))

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

    for budget in budgets:
        year, month = budget["month"].split("-")
        documents.append(
            f"Presupuesto de {budget['category']} para {month}/{year}: "
            f"límite {_format_amount(budget['amount'])}, "
            f"gastado {_format_amount(budget['spent'])}"
        )

    for goal in goals:
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
    def __init__(self, embedder=None, data_provider=None, store_factory=None) -> None:
        self._embedder = embedder
        self._data_provider = data_provider or SqliteDataProvider()
        self._store_factory = store_factory or create_vector_store
        self._stores: dict[int, VectorStoreProvider] = {}
        self._fingerprints: dict[int, tuple] = {}
        self._lock = threading.Lock()

    @staticmethod
    def _namespace(user_id: int) -> str:
        return f"user-{user_id}"

    @staticmethod
    def _persisted_fingerprint(store: VectorStoreProvider) -> tuple | None:
        if not isinstance(store, ChromaVectorStore):
            return None

        raw = store.get_metadata("fingerprint")

        if raw is None:
            return None

        try:
            return tuple(json.loads(raw))
        except (TypeError, ValueError):
            return None

    def _known_fingerprint(self, store: VectorStoreProvider, user_id: int) -> tuple | None:
        persisted = self._persisted_fingerprint(store)

        if persisted is not None:
            return persisted

        return self._fingerprints.get(user_id)

    def _remember_fingerprint(
        self, store: VectorStoreProvider, user_id: int, fingerprint: tuple
    ) -> None:
        self._fingerprints[user_id] = fingerprint

        if isinstance(store, ChromaVectorStore):
            store.set_metadata({"fingerprint": json.dumps(list(fingerprint))})

    def _embed(self, text: str) -> list[float]:
        if self._embedder is None:
            self._embedder = create_embedder()

        return self._embedder(text)

    def _rebuild(self, store: VectorStoreProvider, user_id: int) -> None:
        store.clear()

        for index, document in enumerate(self._data_provider.build_documents(user_id)):
            store.add(f"{user_id}-{index}", document, self._embed(document))

    def retrieve(self, user_id: int, question: str, limit: int = RETRIEVAL_LIMIT) -> list[str]:
        with self._lock:
            fingerprint = self._data_provider.get_fingerprint(user_id)
            store = self._stores.get(user_id)

            if store is None:
                store = self._store_factory(self._namespace(user_id))
                self._stores[user_id] = store

            if self._known_fingerprint(store, user_id) != fingerprint:
                self._rebuild(store, user_id)
                self._remember_fingerprint(store, user_id, fingerprint)

            return store.query(self._embed(question), limit)

    def clear(self, user_id: int) -> None:
        with self._lock:
            store = self._stores.get(user_id)

            if store is None:
                store = self._store_factory(self._namespace(user_id))
                self._stores[user_id] = store

            store.clear()
            self._fingerprints.pop(user_id, None)


user_index = UserIndex()


def retrieve_combined(user_id: int, question: str) -> list[str]:
    from app.config import KNOWLEDGE_LIMIT, RETRIEVAL_LIMIT
    from app.knowledge import knowledge_index

    user_limit = min(RETRIEVAL_LIMIT, RETRIEVAL_LIMIT - KNOWLEDGE_LIMIT)
    user_docs = user_index.retrieve(user_id, question, limit=user_limit)
    knowledge_docs = knowledge_index.retrieve(question, limit=KNOWLEDGE_LIMIT)

    return user_docs + knowledge_docs
