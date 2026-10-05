import { getTursoClient } from './turso.js'

const LIST_QUERY = 'SELECT * FROM transactions WHERE user_id = ?'
const COUNT_QUERY = 'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?'
const ORDER_BY = ' ORDER BY date DESC, id DESC'

function getMissingMonths(from, to) {
  const months = []
  if (!from) return months

  let [fromYear, fromMonth] = from.split('-').map(Number)
  const [toYear, toMonth] = to.split('-').map(Number)

  fromMonth++
  if (fromMonth > 12) {
    fromMonth = 1
    fromYear++
  }

  while (fromYear < toYear || (fromYear === toYear && fromMonth <= toMonth)) {
    months.push(`${fromYear}-${String(fromMonth).padStart(2, '0')}`)
    fromMonth++
    if (fromMonth > 12) {
      fromMonth = 1
      fromYear++
    }
  }
  return months
}

function previousMonth(month) {
  const [year, m] = month.split('-').map(Number)
  if (m === 1) return `${year - 1}-12`
  return `${year}-${String(m - 1).padStart(2, '0')}`
}

function addMonth(month, n) {
  let [year, m] = month.split('-').map(Number)
  m += n
  while (m > 12) {
    m -= 12
    year++
  }
  while (m < 1) {
    m += 12
    year--
  }
  return `${year}-${String(m).padStart(2, '0')}`
}

export async function listTransactions(userId, filters = {}) {
  const { type, category, q, from, to, limit = 50, offset = 0 } = filters
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

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''
  const query = `${LIST_QUERY} ${whereClause}${ORDER_BY} LIMIT ? OFFSET ?`
  const countQuery = `${COUNT_QUERY} ${whereClause}`
  const client = getTursoClient()

  const countResult = await client.execute({
    sql: countQuery,
    args: params
  })
  const total = Number(countResult.rows[0]?.count ?? 0)

  const dataResult = await client.execute({
    sql: query,
    args: [...params, Math.min(parseInt(limit) || 50, 200), parseInt(offset) || 0]
  })

  const data = dataResult.rows.map(row => ({ ...row, id: Number(row.id), user_id: Number(row.user_id) }))

  return {
    data,
    total,
    limit: Math.min(parseInt(limit) || 50, 200),
    offset: parseInt(offset) || 0
  }
}

export async function countTransactions(userId, filters = {}) {
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

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''
  const countQuery = `${COUNT_QUERY} ${whereClause}`
  const result = await getTursoClient().execute({ sql: countQuery, args: params })
  return Number(result.rows[0]?.count ?? 0)
}

export async function findTransactionById(id, userId) {
  const result = await getTursoClient().execute({
    sql: 'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
    args: [id, userId]
  })
  const row = result.rows[0]
  return row ? { ...row, id: Number(row.id), user_id: Number(row.user_id) } : undefined
}

export async function updateTransaction(id, userId, { type, amount, date, description, category }) {
  await getTursoClient().execute({
    sql: 'UPDATE transactions SET type = ?, amount = ?, date = ?, description = ?, category = ? WHERE id = ? AND user_id = ?',
    args: [type, amount, date, description ?? null, category ?? null, id, userId]
  })

  return findTransactionById(id, userId)
}

export async function deleteTransaction(id, userId) {
  return getTursoClient().execute({
    sql: 'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    args: [id, userId]
  })
}

export async function getMonthlyBalance(userId, month) {
  const client = getTursoClient()
  const start = `${month}-01`
  const [year, m] = month.split('-').map(Number)
  const end = new Date(year, m, 0).toISOString().slice(0, 10)

  const incomeResult = await client.execute({
    sql: `
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions
      WHERE user_id = ? AND type = 'income' AND date >= ? AND date <= ?
    `,
    args: [userId, start, end]
  })

  const expenseResult = await client.execute({
    sql: `
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions
      WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?
    `,
    args: [userId, start, end]
  })

  return Number(incomeResult.rows[0]?.total ?? 0) - Number(expenseResult.rows[0]?.total ?? 0)
}

export async function createRolloverIfNeeded(userId) {
  const client = getTursoClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const trackingResult = await client.execute({
    sql: 'SELECT last_processed_month FROM rollover_tracking WHERE user_id = ?',
    args: [userId]
  })
  const tracking = trackingResult.rows[0]
  const lastProcessed = tracking?.last_processed_month || null

  const targetMonth = previousMonth(currentMonth)
  const monthsToProcess = getMissingMonths(lastProcessed, targetMonth)

  if (!tracking) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO rollover_tracking (user_id, last_processed_month) VALUES (?, ?)',
      args: [userId, targetMonth]
    })
    return
  }

  for (const month of monthsToProcess) {
    const balance = await getMonthlyBalance(userId, month)
    if (balance !== 0) {
      const nextMonth = addMonth(month, 1)
      await createTransaction({
        userId,
        type: balance > 0 ? 'income' : 'expense',
        amount: Math.abs(balance),
        date: `${nextMonth}-01`,
        description: `Saldo arrastre ${month}`,
        category: null,
        goal_id: null
      })
    }

    await client.execute({
      sql: 'INSERT OR REPLACE INTO rollover_tracking (user_id, last_processed_month) VALUES (?, ?)',
      args: [userId, month]
    })
  }
}

export async function createTransaction({ userId, type, amount, date, description, category, goal_id = null }) {
  const createdAt = new Date().toISOString().slice(0, 10)
  const result = await getTursoClient().execute({
    sql: 'INSERT INTO transactions (user_id, type, amount, date, description, category, goal_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [userId, type, amount, date, description ?? null, category ?? null, goal_id, createdAt]
  })

  return findTransactionById(Number(result.lastInsertRowid), userId)
}

export function toPublicTransaction(transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    date: transaction.date,
    description: transaction.description,
    category: transaction.category,
    goalId: transaction.goal_id,
    createdAt: transaction.created_at
  }
}
