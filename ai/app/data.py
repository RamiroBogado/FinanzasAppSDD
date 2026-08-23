import sqlite3

from app.config import DB_PATH


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def _fetch_all(query: str, params: tuple = ()) -> list[dict]:
    with _connect() as connection:
        rows = connection.execute(query, params).fetchall()

    return [dict(row) for row in rows]


def get_transactions(user_id: int) -> list[dict]:
    return _fetch_all(
        """
        SELECT date, type, category, description, amount
        FROM transactions
        WHERE user_id = ?
        ORDER BY date DESC, id DESC
        """,
        (user_id,),
    )


def get_budgets(user_id: int) -> list[dict]:
    budgets = _fetch_all(
        """
        SELECT id, category, month, amount
        FROM budgets
        WHERE user_id = ?
        ORDER BY month DESC, id DESC
        """,
        (user_id,),
    )
    expenses = {
        (row["month"], row["category"]): row["spent"]
        for row in _fetch_all(
            """
            SELECT substr(date, 1, 7) AS month, category, SUM(amount) AS spent
            FROM transactions
            WHERE user_id = ? AND type = 'expense'
            GROUP BY substr(date, 1, 7), category
            """,
            (user_id,),
        )
    }

    for budget in budgets:
        budget["spent"] = expenses.get((budget["month"], budget["category"]), 0)

    return budgets


def get_goals(user_id: int) -> list[dict]:
    return _fetch_all(
        """
        SELECT name, target_amount, saved_amount, deadline
        FROM goals
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        """,
        (user_id,),
    )


def get_fingerprint(user_id: int) -> tuple:
    counts = _fetch_all(
        """
        SELECT
          (SELECT COUNT(*) FROM transactions WHERE user_id = ?) AS transactions,
          (SELECT COUNT(*) FROM budgets WHERE user_id = ?) AS budgets,
          (SELECT COUNT(*) FROM goals WHERE user_id = ?) AS goals,
          (SELECT COALESCE(MAX(id), 0) FROM transactions WHERE user_id = ?) AS max_transaction,
          (SELECT COALESCE(MAX(id), 0) FROM budgets WHERE user_id = ?) AS max_budget,
          (SELECT COALESCE(MAX(id), 0) FROM goals WHERE user_id = ?) AS max_goal
        """,
        (user_id,) * 6,
    )

    row = counts[0]

    return (
        row["transactions"],
        row["budgets"],
        row["goals"],
        row["max_transaction"],
        row["max_budget"],
        row["max_goal"],
    )
