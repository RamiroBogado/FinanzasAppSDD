const CREATE_USERS_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
)
`

export function initSchema(db) {
  const usersTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get()

  if (!usersTable) {
    db.exec(CREATE_USERS_SQL)
    return
  }

  const columns = db.prepare('PRAGMA table_info(users)').all().map((column) => column.name)

  if (!columns.includes('password_hash')) {
    db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''`)
  }
  if (!columns.includes('created_at')) {
    db.exec(`ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT ''`)
  }
}