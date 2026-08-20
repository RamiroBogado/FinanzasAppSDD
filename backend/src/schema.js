const CREATE_USERS_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
)
`

const CREATE_TRANSACTIONS_SQL = `
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`

const CREATE_TRANSACTIONS_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date DESC)
`

const USERS_ALTERS = {
  password_hash: "TEXT NOT NULL DEFAULT ''",
  created_at: "TEXT NOT NULL DEFAULT ''"
}

const TRANSACTIONS_ALTERS = {
  user_id: 'INTEGER NOT NULL DEFAULT 0',
  type: "TEXT NOT NULL DEFAULT 'expense'",
  amount: 'INTEGER NOT NULL DEFAULT 0',
  date: "TEXT NOT NULL DEFAULT ''",
  description: 'TEXT',
  category: 'TEXT',
  created_at: "TEXT NOT NULL DEFAULT ''"
}

function ensureTable(db, tableName, createSql, columnAlters) {
  const exists = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName)

  if (!exists) {
    db.exec(createSql)
    return
  }

  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name)

  for (const [name, definition] of Object.entries(columnAlters)) {
    if (!columns.includes(name)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`)
    }
  }
}

export function initSchema(db) {
  ensureTable(db, 'users', CREATE_USERS_SQL, USERS_ALTERS)
  ensureTable(db, 'transactions', CREATE_TRANSACTIONS_SQL, TRANSACTIONS_ALTERS)
  db.exec(CREATE_TRANSACTIONS_INDEX_SQL)
}