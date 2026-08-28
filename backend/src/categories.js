import { getDatabase } from './db.js'

export function listCategories(userId) {
  return getDatabase()
    .prepare(
      'SELECT id, name, type, color, created_at FROM categories WHERE user_id = ? ORDER BY name COLLATE NOCASE'
    )
    .all(userId)
}

export function findCategoryById(id, userId) {
  return getDatabase()
    .prepare('SELECT id, name, type, color, created_at FROM categories WHERE id = ? AND user_id = ?')
    .get(id, userId)
}

export function createCategory({ userId, name, type, color }) {
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const result = getDatabase()
    .prepare(
      'INSERT INTO categories (user_id, name, type, color, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(userId, name, type, color, createdAt)

  return findCategoryById(result.lastInsertRowid, userId)
}

export function updateCategory(id, userId, { name, type, color }) {
  const updates = []
  const params = []

  if (name !== undefined) {
    updates.push('name = ?')
    params.push(name)
  }
  if (type !== undefined) {
    updates.push('type = ?')
    params.push(type)
  }
  if (color !== undefined) {
    updates.push('color = ?')
    params.push(color)
  }

  if (updates.length === 0) {
    return findCategoryById(id, userId)
  }

  params.push(id, userId)

  getDatabase()
    .prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`)
    .run(...params)

  return findCategoryById(id, userId)
}

export function deleteCategory(id, userId) {
  const db = getDatabase()

  const inTransactions = db
    .prepare(
      'SELECT 1 FROM transactions WHERE user_id = ? AND lower(category) = (SELECT lower(name) FROM categories WHERE id = ? AND user_id = ?) LIMIT 1'
    )
    .get(userId, id, userId)

  if (inTransactions) {
    return true
  }

  const inBudgets = db
    .prepare(
      'SELECT 1 FROM budgets WHERE user_id = ? AND lower(category) = (SELECT lower(name) FROM categories WHERE id = ? AND user_id = ?) LIMIT 1'
    )
    .get(userId, id, userId)

  if (inBudgets) {
    return true
  }

  db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(id, userId)
  return false
}