import { getDatabase } from './db.js'

const LIST_QUERY = `
SELECT b.*,
  (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
   WHERE t.user_id = b.user_id AND t.type = 'expense'
     AND t.date >= b.month || '-01' AND t.date <= b.month || '-31'
     AND lower(t.category) = lower(b.category)) AS spent
FROM budgets b WHERE b.user_id = ?
`

const ORDER_BY = ' ORDER BY b.month DESC, b.category COLLATE NOCASE ASC'

export function listBudgets(userId, { month, category } = {}) {
  const conditions = []
  const params = [userId]

  if (month) {
    conditions.push('b.month = ?')
    params.push(month)
  }

  if (category) {
    conditions.push('lower(b.category) = lower(?)')
    params.push(category)
  }

  const query =
    conditions.length > 0
      ? `${LIST_QUERY} AND ${conditions.join(' AND ')}${ORDER_BY}`
      : `${LIST_QUERY}${ORDER_BY}`

  return getDatabase().prepare(query).all(...params)
}

export function findBudgetById(id, userId) {
  return getDatabase().prepare(`${LIST_QUERY} AND b.id = ?`).get(userId, id)
}

export function createBudget({ userId, category, month, amount, threshold }) {
  const createdAt = new Date().toISOString().slice(0, 10)
  const result = getDatabase()
    .prepare(
      'INSERT INTO budgets (user_id, category, month, amount, threshold, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(userId, category, month, amount, threshold, createdAt)

  return findBudgetById(result.lastInsertRowid, userId)
}

export function updateBudget(id, userId, { category, month, amount, threshold }) {
  getDatabase()
    .prepare(
      'UPDATE budgets SET category = ?, month = ?, amount = ?, threshold = COALESCE(?, threshold) WHERE id = ? AND user_id = ?'
    )
    .run(category, month, amount, threshold, id, userId)

  return findBudgetById(id, userId)
}

export function deleteBudget(id, userId) {
  return getDatabase().prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, userId)
}

export function toPublicBudget(budget) {
  return {
    id: budget.id,
    category: budget.category,
    month: budget.month,
    amount: budget.amount,
    threshold: budget.threshold,
    spent: budget.spent,
    createdAt: budget.created_at
  }
}