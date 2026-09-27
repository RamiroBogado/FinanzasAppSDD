import { getTursoClient } from './turso.js'

function normalizeCategory(row) {
  if (!row) return undefined
  return { ...row, id: Number(row.id), user_id: Number(row.user_id) }
}

export async function listCategories(userId) {
  const result = await getTursoClient().execute({
    sql: 'SELECT id, name, type, color, created_at FROM categories WHERE user_id = ? ORDER BY name COLLATE NOCASE',
    args: [userId]
  })
  return result.rows.map(normalizeCategory)
}

export async function findCategoryById(id, userId) {
  const result = await getTursoClient().execute({
    sql: 'SELECT id, name, type, color, created_at FROM categories WHERE id = ? AND user_id = ?',
    args: [id, userId]
  })
  return normalizeCategory(result.rows[0])
}

export async function createCategory({ userId, name, type, color }) {
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const result = await getTursoClient().execute({
    sql: 'INSERT INTO categories (user_id, name, type, color, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [userId, name, type, color, createdAt]
  })
  return findCategoryById(Number(result.lastInsertRowid), userId)
}

export async function updateCategory(id, userId, { name, type, color }) {
  const updates = []
  const params = []
  if (name !== undefined) { updates.push('name = ?'); params.push(name) }
  if (type !== undefined) { updates.push('type = ?'); params.push(type) }
  if (color !== undefined) { updates.push('color = ?'); params.push(color) }
  if (updates.length === 0) return findCategoryById(id, userId)
  params.push(id, userId)
  await getTursoClient().execute({
    sql: `UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    args: params
  })
  return findCategoryById(id, userId)
}

export async function deleteCategory(id, userId) {
  const client = getTursoClient()
  const inTransactions = await client.execute({
    sql: 'SELECT 1 FROM transactions WHERE user_id = ? AND lower(category) = (SELECT lower(name) FROM categories WHERE id = ? AND user_id = ?) LIMIT 1',
    args: [userId, id, userId]
  })
  if (inTransactions.rows[0]) return true
  const inBudgets = await client.execute({
    sql: 'SELECT 1 FROM budgets WHERE user_id = ? AND lower(category) = (SELECT lower(name) FROM categories WHERE id = ? AND user_id = ?) LIMIT 1',
    args: [userId, id, userId]
  })
  if (inBudgets.rows[0]) return true
  await client.execute({ sql: 'DELETE FROM categories WHERE id = ? AND user_id = ?', args: [id, userId] })
  return false
}