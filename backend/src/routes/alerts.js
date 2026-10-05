import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getTursoClient } from '../turso.js'

const router = Router()
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const arsFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
const formatArs = cents => arsFormatter.format(Number(cents) / 100)

router.use(requireAuth)

router.get('/', async (req, res) => {
  const { limit = 50, offset = 0 } = req.query
  const lim = Math.min(parseInt(limit) || 50, 200)
  const off = parseInt(offset) || 0
  const client = getTursoClient()
  const alertsResult = await client.execute({
    sql: 'SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    args: [req.userId, lim, off]
  })
  const countResult = await client.execute({ sql: 'SELECT COUNT(*) as count FROM alerts WHERE user_id = ?', args: [req.userId] })
  res.json({ data: alertsResult.rows.map(toPublicAlert), total: Number(countResult.rows[0]?.count ?? 0), limit: lim, offset: off })
})

router.post('/read-all', async (req, res) => {
  await getTursoClient().execute({ sql: 'UPDATE alerts SET read = 1 WHERE user_id = ? AND read = 0', args: [req.userId] })
  res.json({ message: 'Todas las alertas fueron marcadas como leídas' })
})

router.post('/check', async (req, res) => {
  const rawMonth = req.body?.month
  const month = rawMonth === undefined || rawMonth === null || rawMonth === '' ? currentMonth() : rawMonth
  if (typeof month !== 'string' || !MONTH_PATTERN.test(month)) return res.status(400).json({ error: 'El mes debe tener formato AAAA-MM' })

  const client = getTursoClient()
  const budgetsResult = await client.execute({
    sql: LIST_BUDGETS_QUERY,
    args: [monthStart(month), monthEnd(month), req.userId, month]
  })
  const created = []
  for (const budget of budgetsResult.rows) {
    const percentage = Number(budget.amount) > 0 ? (Number(budget.spent) / Number(budget.amount)) * 100 : 0
    if (Number(budget.spent) > Number(budget.amount)) {
      const alert = await createAlertIfMissing(client, req.userId, budget, month, 'danger', percentage)
      if (alert) created.push(alert)
    } else if (percentage >= Number(budget.threshold)) {
      const alert = await createAlertIfMissing(client, req.userId, budget, month, 'warning', percentage)
      if (alert) created.push(alert)
    }
  }
  res.status(201).json({ created: created.map(toPublicAlert) })
})

router.put('/:id/read', async (req, res) => {
  const result = await getTursoClient().execute({
    sql: 'UPDATE alerts SET read = 1 WHERE id = ? AND user_id = ?',
    args: [req.params.id, req.userId]
  })
  if (Number(result.rowsAffected) === 0) return res.status(404).json({ error: 'Alerta no encontrada' })
  res.json({ message: 'Alerta marcada como leída' })
})

const LIST_BUDGETS_QUERY = `
SELECT b.*,
  (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
   WHERE t.user_id = b.user_id AND t.type = 'expense'
     AND t.date >= ? AND t.date <= ?
     AND lower(t.category) = lower(b.category)) AS spent
FROM budgets b WHERE b.user_id = ? AND b.month = ?
`

function currentMonth() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthStart(month) { return `${month}-01` }

function monthEnd(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(year, monthNumber, 0).toISOString().slice(0, 10)
}

async function createAlertIfMissing(client, userId, budget, month, type, percentage) {
  const existing = await client.execute({
    sql: 'SELECT id FROM alerts WHERE user_id = ? AND lower(category) = lower(?) AND month = ? AND type = ?',
    args: [userId, budget.category, month, type]
  })
  if (existing.rows[0]) return null

  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const message = type === 'danger'
    ? `Presupuesto excedido en ${budget.category}: gastaste ${formatArs(budget.spent)} de ${formatArs(budget.amount)}`
    : `Presupuesto cerca del límite en ${budget.category}: llevás ${formatArs(budget.spent)} de ${formatArs(budget.amount)} (${Math.round(percentage)}%)`

  await client.execute({
    sql: 'INSERT INTO alerts (id, user_id, category, month, type, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
    args: [id, userId, budget.category, month, type, message, createdAt]
  })
  const result = await client.execute({ sql: 'SELECT * FROM alerts WHERE id = ?', args: [id] })
  return result.rows[0]
}

function toPublicAlert(alert) {
  return {
    id: alert.id,
    category: alert.category,
    month: alert.month,
    type: alert.type,
    message: alert.message,
    read: Boolean(alert.read),
    createdAt: alert.created_at
  }
}

export default router