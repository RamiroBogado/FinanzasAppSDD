import { getDatabase } from './db.js'

const LIST_QUERY = 'SELECT * FROM transactions WHERE user_id = ?'
const COUNT_QUERY = 'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?'
const ORDER_BY = ' ORDER BY date DESC, id DESC'

function getMissingMonths(from, to) {
  const months = []
  if (!from) return months
  
  let [fromYear, fromMonth] = from.split('-').map(Number)
  const [toYear, toMonth] = to.split('-').map(Number)
  
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

export function listTransactions(userId, filters = {}) {
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

  const countParams = params.slice(1) // remove userId for count
  const total = getDatabase().prepare(countQuery).get(userId, ...countParams).count

  const data = getDatabase().prepare(query).all(...params, Math.min(parseInt(limit) || 50, 200), parseInt(offset) || 0)

  return { data, total, limit: Math.min(parseInt(limit) || 50, 200), offset: parseInt(offset) || 0 }
}

export function countTransactions(userId, filters = {}) {
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

  return getDatabase().prepare(countQuery).get(...params.slice(1)).count
}

export function findTransactionById(id, userId) {
  return getDatabase()
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .get(id, userId)
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

export function getMonthlyBalance(userId, month) {
  const db = getDatabase()
  const start = `${month}-01`
  const [year, m] = month.split('-').map(Number)
  const end = new Date(year, m, 0).toISOString().slice(0, 10)
  
  const income = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE user_id = ? AND type = 'income' AND date >= ? AND date <= ?
  `).get(userId, start, end).total
  
  const expense = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?
  `).get(userId, start, end).total
  
  return income - expense
}

export function createRolloverIfNeeded(userId) {
  const db = getDatabase()
  const currentMonth = new Date().toISOString().slice(0, 7)
  
  const tracking = db.prepare('SELECT last_processed_month FROM rollover_tracking WHERE user_id = ?').get(userId)
  const lastProcessed = tracking?.last_processed_month || null
  
  const targetMonth = previousMonth(currentMonth)
  const monthsToProcess = getMissingMonths(lastProcessed, targetMonth)
  
  // If no tracking exists, initialize it to targetMonth (don't create retroactive rollovers for new users)
  if (!tracking) {
    db.prepare(`
      INSERT OR REPLACE INTO rollover_tracking (user_id, last_processed_month) VALUES (?, ?)
    `).run(userId, targetMonth)
    return
  }
  
  for (const month of monthsToProcess) {
    const balance = getMonthlyBalance(userId, month)
    if (balance !== 0) {
      const nextMonth = addMonth(month, 1)
      createTransaction({
        userId,
        type: balance > 0 ? 'income' : 'expense',
        amount: Math.abs(balance),
        date: `${nextMonth}-01`,
        description: `Saldo arrastre ${month}`,
        category: null,
        goal_id: null
      })
    }
    db.prepare(`
      INSERT OR REPLACE INTO rollover_tracking (user_id, last_processed_month) VALUES (?, ?)
    `).run(userId, month)
  }
}

export function createTransaction({ userId, type, amount, date, description, category, goal_id = null }) {
  const createdAt = new Date().toISOString().slice(0, 10)
  const result = getDatabase()
    .prepare(
      'INSERT INTO transactions (user_id, type, amount, date, description, category, goal_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(userId, type, amount, date, description ?? null, category ?? null, goal_id, createdAt)

  return findTransactionById(result.lastInsertRowid, userId)
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