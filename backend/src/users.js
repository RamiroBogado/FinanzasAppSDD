import { getTursoClient } from './turso.js'

function normalizeUser(row) {
  if (!row) return undefined

  return {
    ...row,
    id: Number(row.id)
  }
}

export async function findUserById(id) {
  const result = await getTursoClient().execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id]
  })

  return normalizeUser(result.rows[0])
}

export async function findUserByUsername(username) {
  const result = await getTursoClient().execute({
    sql: 'SELECT * FROM users WHERE username = ?',
    args: [username]
  })

  return normalizeUser(result.rows[0])
}

export async function findUserByEmail(email) {
  const result = await getTursoClient().execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email]
  })

  return normalizeUser(result.rows[0])
}

export async function createUser({ username, email, passwordHash }) {
  const createdAt = new Date().toISOString().slice(0, 10)
  const client = getTursoClient()

  const result = await client.execute({
    sql: 'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
    args: [username, email, passwordHash, createdAt]
  })

  return findUserById(Number(result.lastInsertRowid))
}

export function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.created_at
  }
}
