import sqlite3
import sys
import types

import pytest

import app.data as data_module
from app.data import (
    get_budgets,
    get_fingerprint,
    get_goals,
    get_transactions,
)


SCHEMA = """
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  description TEXT,
  amount INTEGER NOT NULL
);
CREATE TABLE budgets (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  month TEXT NOT NULL,
  amount INTEGER NOT NULL
);
CREATE TABLE goals (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  saved_amount INTEGER NOT NULL DEFAULT 0,
  deadline TEXT,
  created_at TEXT NOT NULL DEFAULT '2026-01-01'
);
"""


class FakeCursor:
    def __init__(self, description, rows):
        self.description = description
        self._rows = rows

    def fetchall(self):
        return list(self._rows)


class FakeTursoConnection:
    def __init__(self, db_path, queries):
        self._db_path = db_path
        self._queries = queries

    def execute(self, query, params=()):
        if not query.strip().upper().startswith("SELECT"):
            raise RuntimeError("read-only: writes are rejected")
        self._queries.append((query, tuple(params)))
        connection = sqlite3.connect(self._db_path)
        try:
            cursor = connection.execute(query, params)
            description = [(column[0],) for column in cursor.description]
            rows = cursor.fetchall()
        finally:
            connection.close()
        return FakeCursor(description, rows)

    def close(self):
        pass


def install_fake_turso(monkeypatch, db_path, queries):
    module = types.ModuleType("libsql_experimental")

    def connect(database=None, auth_token=None):
        assert auth_token, "auth token required"
        return FakeTursoConnection(db_path, queries)

    module.connect = connect
    monkeypatch.setitem(sys.modules, "libsql_experimental", module)
    return module


@pytest.fixture()
def fixture_db(tmp_path, monkeypatch):
    db_path = str(tmp_path / "finanzas.db")
    connection = sqlite3.connect(db_path)
    connection.executescript(SCHEMA)
    connection.executemany(
        "INSERT INTO transactions (id, user_id, date, type, category, description, amount)"
        " VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            (1, 1, "2026-09-10", "expense", "Comida", "Supermercado", 45000),
            (2, 1, "2026-09-01", "income", "Sueldo", "Salario", 200000),
            (3, 2, "2026-09-11", "expense", "Transporte", "Subte", 15000),
        ],
    )
    connection.executemany(
        "INSERT INTO budgets (id, user_id, category, month, amount) VALUES (?, ?, ?, ?, ?)",
        [
            (1, 1, "Comida", "2026-09", 60000),
            (2, 2, "Transporte", "2026-09", 20000),
        ],
    )
    connection.executemany(
        "INSERT INTO goals (id, user_id, name, target_amount, saved_amount, deadline, created_at)"
        " VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            (1, 1, "Viaje", 500000, 100000, "2026-12-31", "2026-01-01"),
            (2, 2, "Bicicleta", 80000, 10000, "2026-10-31", "2026-01-02"),
        ],
    )
    connection.commit()
    connection.close()
    monkeypatch.setattr(data_module, "DB_PATH", db_path)
    monkeypatch.setattr(data_module, "TURSO_DATABASE_URL", "")
    monkeypatch.setattr(data_module, "TURSO_AUTH_TOKEN", "")
    return db_path


def enable_turso(monkeypatch, db_path, queries):
    install_fake_turso(monkeypatch, db_path, queries)
    monkeypatch.setattr(data_module, "TURSO_DATABASE_URL", "libsql://test.turso.io")
    monkeypatch.setattr(data_module, "TURSO_AUTH_TOKEN", "read-only-token")


def test_sqlite_branch_returns_only_own_user_data(fixture_db):
    transactions = get_transactions(1)

    assert [row["description"] for row in transactions] == ["Supermercado", "Salario"]
    assert all("user_id" not in row for row in transactions)

    other = get_transactions(2)

    assert [row["description"] for row in other] == ["Subte"]


def test_turso_parity_with_sqlite(fixture_db, monkeypatch, tmp_path):
    sqlite_transactions = get_transactions(1)
    sqlite_budgets = get_budgets(1)
    sqlite_goals = get_goals(1)
    sqlite_fingerprint = get_fingerprint(1)

    queries: list = []
    enable_turso(monkeypatch, fixture_db, queries)

    assert get_transactions(1) == sqlite_transactions
    assert get_budgets(1) == sqlite_budgets
    assert get_goals(1) == sqlite_goals
    assert get_fingerprint(1) == sqlite_fingerprint


def test_turso_queries_keep_user_id_filter(fixture_db, monkeypatch):
    queries: list = []
    enable_turso(monkeypatch, fixture_db, queries)

    get_transactions(1)
    get_budgets(1)
    get_goals(1)
    get_fingerprint(1)

    assert queries, "expected Turso queries to be recorded"
    for query, params in queries:
        assert "user_id" in query
        assert params and all(param == 1 for param in params)


def test_turso_isolation_between_users(fixture_db, monkeypatch):
    queries: list = []
    enable_turso(monkeypatch, fixture_db, queries)

    user_transactions = get_transactions(1)
    other_transactions = get_transactions(2)

    assert [row["description"] for row in user_transactions] == ["Supermercado", "Salario"]
    assert [row["description"] for row in other_transactions] == ["Subte"]

    user_budgets = get_budgets(1)
    other_budgets = get_budgets(2)

    assert [row["category"] for row in user_budgets] == ["Comida"]
    assert [row["category"] for row in other_budgets] == ["Transporte"]

    assert get_goals(1)[0]["name"] == "Viaje"
    assert get_goals(2)[0]["name"] == "Bicicleta"


def test_turso_write_is_rejected_and_data_stays_intact(fixture_db, monkeypatch):
    before = get_transactions(1)

    queries: list = []
    enable_turso(monkeypatch, fixture_db, queries)

    with pytest.raises(RuntimeError):
        data_module._fetch_turso(
            "INSERT INTO transactions (user_id, date, type, amount) VALUES (?, ?, ?, ?)",
            (1, "2026-09-12", "expense", 999),
        )

    monkeypatch.setattr(data_module, "TURSO_DATABASE_URL", "")
    monkeypatch.setattr(data_module, "TURSO_AUTH_TOKEN", "")

    assert get_transactions(1) == before
