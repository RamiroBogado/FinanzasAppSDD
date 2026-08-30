import { getDatabase } from './db.js'

const LIST_QUERY = `
SELECT b.*,
  (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
   WHERE t.user_id = b.user_id AND t.type = 'expense'
     AND t.date >= b.month || '-01'
     AND t.date <= date(b.month || '-01', '+1 month', '-1 day')
     AND lower(t.category) = lower(b.category)) AS spent
FROM budgets b WHERE b.user_id = ?
`

const COUNT_QUERY = `
SELECT COUNT(*) as count FROM budgets b WHERE b.user_id = ?
`

const ORDER_BY = ' ORDER BY b.month DESC, b.category COLLATE NOCASE ASC'

export function listBudgets(userId, { month, category, limit = 50, offset = 0 } = {}) {
  const conditions = []
  const params = []

  if (month) {
    conditions.push('b.month = ?')
    params.push(month)
  }

  if (category) {
    conditions.push('lower(b.category) = lower(?)')
    params.push(category)
  }

  const countParams = [userId]
  if (month) {
    countParams.push(month)
  }
  if (category) {
    countParams.push(category)
  }

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''
  const query = `${LIST_QUERY} ${whereClause}${ORDER_BY} LIMIT ? OFFSET ?`
  const countQuery = `${COUNT_QUERY} ${whereClause}`

  const total = getDatabase().prepare(countQuery).get(...[userId, ...(month ? [month] : []), ...(category ? [category] : [])]).count

  const queryParams = [userId, ...params, Math.min(parseInt(limit) || 50, 200), parseInt(offset) || 0]
  const data = getDatabase().prepare(query).all(...queryParams)

  return { data, total, limit: Math.min(parseInt(limit) || 50, 200), offset: parseInt(offset) || 0 }
}

export function countBudgets(userId, { month, category } = {}) {
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

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''
  const countQuery = `${COUNT_QUERY} ${whereClause}`

  return getDatabase().prepare(countQuery).get(...params.slice(1)).count
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