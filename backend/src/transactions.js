import { getDatabase } from './db.js'

const LIST_QUERY = 'SELECT * FROM transactions WHERE user_id = ?'
const ORDER_BY = ' ORDER BY date DESC, id DESC'

export function listTransactions(userId, type) {
  const query = type ? `${LIST_QUERY} AND type = ?${ORDER_BY}` : `${LIST_QUERY}${ORDER_BY}`
  const params = type ? [userId, type] : [userId]
  return getDatabase().prepare(query).all(...params)
}

export function findTransactionById(id, userId) {
  return getDatabase()
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .get(id, userId)
}

export function createTransaction({ userId, type, amount, date, description }) {
  const createdAt = new Date().toISOString().slice(0, 10)
  const result = getDatabase()
    .prepare(
      'INSERT INTO transactions (user_id, type, amount, date, description, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(userId, type, amount, date, description ?? null, createdAt)

  return findTransactionById(result.lastInsertRowid, userId)
}

export function updateTransaction(id, userId, { type, amount, date, description }) {
  getDatabase()
    .prepare(
      'UPDATE transactions SET type = ?, amount = ?, date = ?, description = ? WHERE id = ? AND user_id = ?'
    )
    .run(type, amount, date, description ?? null, id, userId)

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
    createdAt: transaction.created_at
  }
}