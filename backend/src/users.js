import { getDatabase } from './db.js'

export function findUserById(id) {
  return getDatabase().prepare('SELECT * FROM users WHERE id = ?').get(id)
}

export function findUserByUsername(username) {
  return getDatabase().prepare('SELECT * FROM users WHERE username = ?').get(username)
}

export function findUserByEmail(email) {
  return getDatabase().prepare('SELECT * FROM users WHERE email = ?').get(email)
}

export function createUser({ username, email, passwordHash }) {
  const createdAt = new Date().toISOString().slice(0, 10)
  const result = getDatabase()
    .prepare('INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(username, email, passwordHash, createdAt)

  return findUserById(result.lastInsertRowid)
}

export function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.created_at
  }
}