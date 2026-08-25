import sqlite3

import pytest

from app import data
from app.indexer import build_documents


@pytest.fixture()
def user_database(monkeypatch, tmp_path):
    database_path = tmp_path / "finanzas.db"
    connection = sqlite3.connect(database_path)
    connection.executescript(
        """
        CREATE TABLE transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          amount INTEGER NOT NULL,
          date TEXT NOT NULL,
          description TEXT,
          category TEXT,
          created_at TEXT DEFAULT ''
        );
        CREATE TABLE budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category TEXT NOT NULL,
          month TEXT NOT NULL,
          amount INTEGER NOT NULL
        );
        CREATE TABLE goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          target_amount INTEGER NOT NULL,
          saved_amount INTEGER DEFAULT 0,
          deadline TEXT,
          created_at TEXT DEFAULT ''
        );
        """
    )
    connection.execute(
        "INSERT INTO transactions (user_id, type, amount, date, description, category)"
        " VALUES (1, 'expense', 2500000, '2026-08-10', 'Supermercado', 'Compras')"
    )
    connection.execute(
        "INSERT INTO transactions (user_id, type, amount, date, description, category)"
        " VALUES (1, 'expense', 90000, '2026-08-11', NULL, 'Compras')"
    )
    connection.execute(
        "INSERT INTO transactions (user_id, type, amount, date, description, category)"
        " VALUES (1, 'income', 100000000, '2026-08-01', 'Sueldo', 'Sueldo')"
    )
    connection.execute(
        "INSERT INTO transactions (user_id, type, amount, date, description, category)"
        " VALUES (2, 'expense', 500000, '2026-08-02', 'Otro usuario', 'Ocio')"
    )
    connection.execute(
        "INSERT INTO budgets (user_id, category, month, amount)"
        " VALUES (1, 'Compras', '2026-08', 3000000)"
    )
    connection.execute(
        "INSERT INTO goals (user_id, name, target_amount, saved_amount, deadline)"
        " VALUES (1, 'Vacaciones', 50000000, 20000000, '2026-12-01')"
    )
    connection.commit()
    connection.close()

    monkeypatch.setattr(data, "DB_PATH", str(database_path))

    return database_path


def test_build_documents_formats_user_data_in_spanish(user_database):
    documents = build_documents(1)
    joined = "\n".join(documents)

    assert len(documents) == 9
    assert "Transacción del 10/08/2026: Gasto de $25,000.00 en Compras (Supermercado)" in joined
    assert "Transacción del 11/08/2026: Gasto de $900.00 en Compras" in joined
    assert "Ingreso de $1,000,000.00 en Sueldo (Sueldo)" in joined
    assert "Presupuesto de Compras para 08/2026: límite $30,000.00, gastado $25,900.00" in joined
    assert "Meta de ahorro Vacaciones: objetivo $500,000.00, ahorrado $200,000.00, fecha límite 01/12/2026" in joined
    assert "Resumen de 08/2026: ingresos $1,000,000.00, gastos $25,900.00" in joined
    assert "Gastos por categoría en 08/2026: Compras $25,900.00 (mayor gasto)" in joined
    assert "Mayor gasto de 08/2026: 10/08/2026 $25,000.00 en Compras (Supermercado)" in joined


def test_build_documents_isolates_users(user_database):
    documents = build_documents(2)

    assert len(documents) == 5
    assert "Otro usuario" in documents[1]
    assert "Resumen de 08/2026: ingresos $0.00, gastos $5,000.00" in documents[2]
    assert "Gastos por categoría en 08/2026: Ocio $5,000.00 (mayor gasto)" in documents[3]


def test_overview_document_is_first(user_database):
    documents = build_documents(1)

    assert documents[0].startswith("Resumen financiero del usuario:")
    assert "saldo $974,100.00" in documents[0]
    assert "ingresos $1,000,000.00" in documents[0]
    assert "gastos $25,900.00" in documents[0]


def test_overview_includes_budgets_and_goals(user_database):
    documents = build_documents(1)

    overview = documents[0]
    assert "Presupuesto de Compras" in overview
    assert "Meta de ahorro Vacaciones" in overview


def test_overview_reflects_new_transaction(user_database, tmp_path):
    documents_before = build_documents(1)
    overview_before = documents_before[0]
    assert "$974,100.00" in overview_before

    connection = sqlite3.connect(user_database)
    connection.execute(
        "INSERT INTO transactions (user_id, type, amount, date, description, category)"
        " VALUES (1, 'income', 100000, '2026-08-15', 'Bonus', 'Sueldo')"
    )
    connection.commit()
    connection.close()

    documents_after = build_documents(1)
    overview_after = documents_after[0]
    assert "$1,001,000.00" in overview_after
    assert "$975,100.00" in overview_after


def test_fingerprint_changes_with_data(user_database):
    before = data.get_fingerprint(1)

    connection = sqlite3.connect(user_database)
    connection.execute("DELETE FROM transactions WHERE user_id = 1")
    connection.commit()
    connection.close()

    after = data.get_fingerprint(1)

    assert before != after
