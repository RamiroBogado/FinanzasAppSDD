import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getDatabase } from '../db.js'

const router = Router()

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2
})

const formatArs = (cents) => arsFormatter.format(cents / 100)

router.use(requireAuth)

router.get('/', (req, res) => {
  const alerts = getDatabase()
    .prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(req.userId)

  res.json(alerts.map(toPublicAlert))
})

router.post('/read-all', (req, res) => {
  getDatabase()
    .prepare('UPDATE alerts SET read = 1 WHERE user_id = ? AND read = 0')
    .run(req.userId)

  res.json({ message: 'Todas las alertas fueron marcadas como leídas' })
})

router.post('/check', (req, res) => {
  const rawMonth = req.body?.month
  const month = rawMonth === undefined || rawMonth === null || rawMonth === '' ? currentMonth() : rawMonth

  if (typeof month !== 'string' || !MONTH_PATTERN.test(month)) {
    return res.status(400).json({ error: 'El mes debe tener formato AAAA-MM' })
  }

  const db = getDatabase()
  const budgets = db
    .prepare(LIST_BUDGETS_QUERY)
    .all(req.userId, month)
  const created = []

  for (const budget of budgets) {
    const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0

    if (budget.spent > budget.amount) {
      created.push(...createAlertIfMissing(db, req.userId, budget, month, 'danger', percentage))
    } else if (percentage >= budget.threshold) {
      created.push(...createAlertIfMissing(db, req.userId, budget, month, 'warning', percentage))
    }
  }

  res.status(201).json({ created: created.map(toPublicAlert) })
})

router.put('/:id/read', (req, res) => {
  const result = getDatabase()
    .prepare('UPDATE alerts SET read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Alerta no encontrada' })
  }

  res.json({ message: 'Alerta marcada como leída' })
})

const LIST_BUDGETS_QUERY = `
SELECT b.*,
  (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
   WHERE t.user_id = b.user_id AND t.type = 'expense'
     AND t.date >= b.month || '-01' AND t.date <= b.month || '-31'
     AND lower(t.category) = lower(b.category)) AS spent
FROM budgets b WHERE b.user_id = ? AND b.month = ?
`

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function createAlertIfMissing(db, userId, budget, month, type, percentage) {
  const existing = db
    .prepare(
      "SELECT id FROM alerts WHERE user_id = ? AND lower(category) = lower(?) AND month = ? AND type = ?"
    )
    .get(userId, budget.category, month, type)

  if (existing) {
    return []
  }

  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const message =
    type === 'danger'
      ? `Presupuesto excedido en ${budget.category}: gastaste ${formatArs(budget.spent)} de ${formatArs(budget.amount)}`
      : `Presupuesto cerca del límite en ${budget.category}: llevás ${formatArs(budget.spent)} de ${formatArs(budget.amount)} (${Math.round(percentage)}%)`

  db.prepare(
    'INSERT INTO alerts (id, user_id, category, month, type, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)'
  ).run(id, userId, budget.category, month, type, message, createdAt)

  return [db.prepare('SELECT * FROM alerts WHERE id = ?').get(id)]
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
