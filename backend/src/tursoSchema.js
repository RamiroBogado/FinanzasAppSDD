import { getTursoClient } from './turso.js'

const CREATE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    category TEXT,
    goal_id INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    month TEXT NOT NULL,
    amount INTEGER NOT NULL,
    threshold INTEGER NOT NULL DEFAULT 80,
    created_at TEXT NOT NULL,
    UNIQUE (user_id, category COLLATE NOCASE, month),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    name_lower TEXT GENERATED ALWAYS AS (lower(name)) STORED,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    month TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('warning', 'danger')),
    message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE (user_id, category COLLATE NOCASE, month, type),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_amount INTEGER NOT NULL,
    saved_amount INTEGER NOT NULL DEFAULT 0,
    deadline TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS chat_action_requests (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    summary TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
    result TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    confirmed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS chat_action_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (request_id) REFERENCES chat_action_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    jti TEXT NOT NULL UNIQUE,
    used INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS rollover_tracking (
    user_id INTEGER PRIMARY KEY,
    last_processed_month TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
]

const INDEX_STATEMENTS = [
  'CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date DESC)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_user_month ON transactions (user_id, date)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_goal ON transactions (goal_id)',
  'CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets (user_id, month)',
  'CREATE INDEX IF NOT EXISTS idx_goals_user_created ON goals (user_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_alerts_user_read ON alerts (user_id, read)',
  'CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id, id)',
  'CREATE INDEX IF NOT EXISTS idx_chat_action_requests_user_status ON chat_action_requests (user_id, status)',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name ON categories (user_id, name_lower)',
  'CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id)',
]

export async function initTursoSchema(client = getTursoClient()) {
  for (const sql of CREATE_STATEMENTS) {
    await client.execute(sql)
  }

  for (const sql of INDEX_STATEMENTS) {
    await client.execute(sql)
  }

  return true
}
