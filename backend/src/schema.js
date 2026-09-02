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

const CREATE_BUDGETS_SQL = `
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  month TEXT NOT NULL,
  amount INTEGER NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 80,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, category COLLATE NOCASE, month),
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`

const CREATE_BUDGETS_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets (user_id, month)
`

const CREATE_CATEGORIES_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  name_lower TEXT GENERATED ALWAYS AS (lower(name)) STORED,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`

const CREATE_CATEGORIES_INDEX_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name ON categories (user_id, name_lower)
`

const CREATE_ALERTS_SQL = `
CREATE TABLE IF NOT EXISTS alerts (
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
)
`

const CREATE_ALERTS_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_alerts_user_read ON alerts (user_id, read)
`

const CREATE_GOALS_SQL = `
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  saved_amount INTEGER NOT NULL DEFAULT 0,
  deadline TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`

const CREATE_GOALS_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_goals_user_created ON goals (user_id, created_at DESC)
`

const CREATE_CHAT_MESSAGES_SQL = `
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`

const CREATE_CHAT_MESSAGES_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id, id)
`

const CREATE_CHAT_ACTION_REQUESTS_SQL = `
CREATE TABLE IF NOT EXISTS chat_action_requests (
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
)
`

const CREATE_CHAT_ACTION_REQUESTS_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_chat_action_requests_user_status ON chat_action_requests (user_id, status)
`

const CREATE_CHAT_ACTION_AUDIT_SQL = `
CREATE TABLE IF NOT EXISTS chat_action_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES chat_action_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
`

const CREATE_PASSWORD_RESET_TOKENS_SQL = `
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  jti TEXT NOT NULL UNIQUE,
  used INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
`

const CREATE_ROLLOVER_TRACKING_SQL = `
CREATE TABLE IF NOT EXISTS rollover_tracking (
  user_id INTEGER PRIMARY KEY,
  last_processed_month TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`

const CREATE_PASSWORD_RESET_TOKENS_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id)
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
  created_at: "TEXT NOT NULL DEFAULT ''",
  goal_id: 'INTEGER'
}

const BUDGETS_ALTERS = {
  user_id: 'INTEGER NOT NULL DEFAULT 0',
  category: "TEXT NOT NULL DEFAULT ''",
  month: "TEXT NOT NULL DEFAULT ''",
  amount: 'INTEGER NOT NULL DEFAULT 0',
  threshold: 'INTEGER NOT NULL DEFAULT 80',
  created_at: "TEXT NOT NULL DEFAULT ''"
}

const GOALS_ALTERS = {
  user_id: 'INTEGER NOT NULL DEFAULT 0',
  name: "TEXT NOT NULL DEFAULT ''",
  target_amount: 'INTEGER NOT NULL DEFAULT 0',
  saved_amount: 'INTEGER NOT NULL DEFAULT 0',
  deadline: 'TEXT',
  created_at: "TEXT NOT NULL DEFAULT ''"
}

const PASSWORD_RESET_TOKENS_ALTERS = {}

function ensureTable(db, tableName, createSql, columnAlters) {
  const exists = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName)

  if (!exists) {
    db.exec(createSql)
  }

  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name)

  for (const [name, definition] of Object.entries(columnAlters)) {
    if (!columns.includes(name)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`)
    }
  }
}

const CATEGORIES_ALTERS = {}

export function initSchema(db) {
  ensureTable(db, 'users', CREATE_USERS_SQL, USERS_ALTERS)
  ensureTable(db, 'transactions', CREATE_TRANSACTIONS_SQL, TRANSACTIONS_ALTERS)
  ensureTable(db, 'budgets', CREATE_BUDGETS_SQL, BUDGETS_ALTERS)
  ensureTable(db, 'goals', CREATE_GOALS_SQL, GOALS_ALTERS)
  ensureTable(db, 'alerts', CREATE_ALERTS_SQL, {})
  ensureTable(db, 'chat_messages', CREATE_CHAT_MESSAGES_SQL, {})
  ensureTable(db, 'chat_action_requests', CREATE_CHAT_ACTION_REQUESTS_SQL, {})
  ensureTable(db, 'chat_action_audit', CREATE_CHAT_ACTION_AUDIT_SQL, {})
  ensureTable(db, 'categories', CREATE_CATEGORIES_SQL, CATEGORIES_ALTERS)
  ensureTable(db, 'password_reset_tokens', CREATE_PASSWORD_RESET_TOKENS_SQL, PASSWORD_RESET_TOKENS_ALTERS)
  ensureTable(db, 'rollover_tracking', CREATE_ROLLOVER_TRACKING_SQL, {})
  db.exec(CREATE_TRANSACTIONS_INDEX_SQL)
  db.exec(CREATE_BUDGETS_INDEX_SQL)
  db.exec(CREATE_GOALS_INDEX_SQL)
  db.exec(CREATE_ALERTS_INDEX_SQL)
  db.exec(CREATE_CHAT_MESSAGES_INDEX_SQL)
  db.exec(CREATE_CHAT_ACTION_REQUESTS_INDEX_SQL)
  db.exec(CREATE_CATEGORIES_INDEX_SQL)
  db.exec(CREATE_PASSWORD_RESET_TOKENS_INDEX_SQL)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_user_month ON transactions (user_id, date)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_goal ON transactions (goal_id)`)
}

const PALETTE = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#f59e0b', '#ef4444',
  '#10b981', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'
]

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function seedCategoriesFromTransactions(db) {
  const rows = db.prepare(`
    SELECT DISTINCT user_id, category, type
    FROM transactions
    WHERE category IS NOT NULL AND category != ''
  `).all()

  const grouped = new Map()
  for (const row of rows) {
    const key = `${row.user_id}|${row.category}`
    if (!grouped.has(key)) {
      grouped.set(key, { user_id: row.user_id, name: row.category, expense: 0, income: 0 })
    }
    const g = grouped.get(key)
    if (row.type === 'expense') g.expense++
    else g.income++
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO categories (user_id, name, type, color, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `)

  for (const [, g] of grouped) {
    const type = g.expense >= g.income ? 'expense' : 'income'
    const colorIndex = simpleHash(`${g.user_id}|${g.name}`) % PALETTE.length
    const color = PALETTE[colorIndex]
    insert.run(g.user_id, g.name, type, color)
  }
}
