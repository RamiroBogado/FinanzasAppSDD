import { getDatabase } from './db.js'

const LIST_QUERY = 'SELECT * FROM transactions WHERE user_id = ?'
const ORDER_BY = ' ORDER BY date DESC, id DESC'

export function listTransactions(userId, filters = {}) {
  const { type, category, q, from, to } = filters
  const conditions = []
  const params = [userId]

  if (type) {
    conditions.push('type = ?')
    params.push(type)
  }

  if (category) {
    conditions.push('lower(category) = lower(?)')
    params.push(category)
  }

  if (q) {
    conditions.push("lower(description) LIKE lower(?) ESCAPE '\\'")
    params.push(`%${q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`)
  }

  if (from) {
    conditions.push('date >= ?')
    params.push(from)
  }

  if (to) {
    conditions.push('date <= ?')
    params.push(to)
  }

  const query =
    conditions.length > 0
      ? `${LIST_QUERY} AND ${conditions.join(' AND ')}${ORDER_BY}`
      : `${LIST_QUERY}${ORDER_BY}`

  return getDatabase().prepare(query).all(...params)
}

export function findTransactionById(id, userId) {
  return getDatabase()
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .get(id, userId)
}

export function createTransaction({ userId, type, amount, date, description, category }) {
  const createdAt = new Date().toISOString().slice(0, 10)
  const result = getDatabase()
    .prepare(
      'INSERT INTO transactions (user_id, type, amount, date, description, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(userId, type, amount, date, description ?? null, category ?? null, createdAt)

  return findTransactionById(result.lastInsertRowid, userId)
}

export function updateTransaction(id, userId, { type, amount, date, description, category }) {
  getDatabase()
    .prepare(
      'UPDATE transactions SET type = ?, amount = ?, date = ?, description = ?, category = ? WHERE id = ? AND user_id = ?'
    )
    .run(type, amount, date, description ?? null, category ?? null, id, userId)

  return findTransactionById(id, userId)
}

export function deleteTransaction(id, userId) {
  return getDatabase().prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId)
}

export function toPublicTransaction(transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    date: transaction.date,
    description: transaction.description,
    category: transaction.category,
    createdAt: transaction.created_at
  }
}