import { getTursoClient } from './turso.js'

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

function normalizeBudget(row) {
  if (!row) return undefined
  return { ...row, id: Number(row.id), user_id: Number(row.user_id) }
}

export async function listBudgets(userId, { month, category, limit = 50, offset = 0 } = {}) {
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
  const query = `${LIST_QUERY} ${whereClause}${ORDER_BY} LIMIT ? OFFSET ?`
  const countQuery = `${COUNT_QUERY} ${whereClause}`
  const client = getTursoClient()

  const countResult = await client.execute({ sql: countQuery, args: params })
  const total = Number(countResult.rows[0]?.count ?? 0)
  const normalizedLimit = Math.min(parseInt(limit) || 50, 200)
  const normalizedOffset = parseInt(offset) || 0

  const dataResult = await client.execute({
    sql: query,
    args: [...params, normalizedLimit, normalizedOffset]
  })

  const data = dataResult.rows.map(normalizeBudget)
  return { data, total, limit: normalizedLimit, offset: normalizedOffset }
}

export async function countBudgets(userId, { month, category } = {}) {
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
  const result = await getTursoClient().execute({
    sql: `${COUNT_QUERY} ${whereClause}`,
    args: params
  })

  return Number(result.rows[0]?.count ?? 0)
}

export async function findBudgetById(id, userId) {
  const result = await getTursoClient().execute({
    sql: `${LIST_QUERY} AND b.id = ?`,
    args: [userId, id]
  })
  return normalizeBudget(result.rows[0])
}

export async function createBudget({ userId, category, month, amount, threshold }) {
  const createdAt = new Date().toISOString().slice(0, 10)
  const result = await getTursoClient().execute({
    sql: 'INSERT INTO budgets (user_id, category, month, amount, threshold, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [userId, category, month, amount, threshold, createdAt]
  })

  return findBudgetById(Number(result.lastInsertRowid), userId)
}

export async function updateBudget(id, userId, { category, month, amount, threshold }) {
  await getTursoClient().execute({
    sql: 'UPDATE budgets SET category = ?, month = ?, amount = ?, threshold = COALESCE(?, threshold) WHERE id = ? AND user_id = ?',
    args: [category, month, amount, threshold, id, userId]
  })

  return findBudgetById(id, userId)
}

export async function deleteBudget(id, userId) {
  return getTursoClient().execute({
    sql: 'DELETE FROM budgets WHERE id = ? AND user_id = ?',
    args: [id, userId]
  })
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
