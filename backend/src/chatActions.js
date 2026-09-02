import { randomUUID } from 'node:crypto'
import { getDatabase } from './db.js'
import { createTransaction, deleteTransaction, findTransactionById, toPublicTransaction, updateTransaction } from './transactions.js'
import { createCategory, deleteCategory, findCategoryById, updateCategory } from './categories.js'
import { createBudget, deleteBudget, findBudgetById, toPublicBudget, updateBudget } from './budgets.js'
import { adjustGoalWithTransaction, createGoal, deleteGoal, findGoalById, toPublicGoal, updateGoal } from './goals.js'

const ACTION_TTL_MS = 5 * 60 * 1000

export const SUPPORTED_ACTIONS = new Set([
  'create_transaction', 'update_transaction', 'delete_transaction',
  'create_category', 'update_category', 'delete_category',
  'create_budget', 'update_budget', 'delete_budget',
  'create_goal', 'update_goal', 'delete_goal', 'adjust_goal',
  'mark_alert_read', 'mark_all_alerts_read', 'export_transactions'
])

function now() {
  return new Date().toISOString()
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeAction(action) {
  if (!action || typeof action !== 'object' || !SUPPORTED_ACTIONS.has(action.type)) return null
  if (typeof action.summary !== 'string' || !action.summary.trim() || !action.payload || typeof action.payload !== 'object') return null

  const payload = { ...action.payload }
  const colors = {
    violeta: '#6366f1', morado: '#8b5cf6', amarillo: '#f59e0b', rojo: '#ef4444',
    verde: '#10b981', azul: '#3b82f6', rosa: '#ec4899', turquesa: '#14b8a6', naranja: '#f97316'
  }
  if (typeof payload.color === 'string' && colors[payload.color.trim().toLowerCase()]) {
    payload.color = colors[payload.color.trim().toLowerCase()]
  }
  if (action.type === 'create_transaction' && !payload.date) payload.date = today()
  if (action.type === 'create_goal' && payload.savedAmount === undefined) payload.savedAmount = 0
  if ((action.type === 'create_budget' || action.type === 'update_budget') && payload.threshold === undefined) payload.threshold = 80
  if (action.type === 'create_category' && !payload.color) payload.color = '#6366f1'
  return { ...action, payload }
}

function toPublic(row) {
  if (!row) return null
  return {
    id: row.id,
    actionType: row.action_type,
    payload: JSON.parse(row.payload),
    summary: row.summary,
    status: row.status,
    result: row.result ? JSON.parse(row.result) : null,
    expiresAt: row.expires_at
  }
}

export function createActionRequest({ userId, action }) {
  const normalizedAction = normalizeAction(action)
  if (!normalizedAction) return null

  const id = randomUUID()
  const createdAt = now()
  const expiresAt = new Date(Date.now() + ACTION_TTL_MS).toISOString()
  getDatabase().prepare(`
    INSERT INTO chat_action_requests (id, user_id, action_type, payload, summary, status, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(id, userId, normalizedAction.type, JSON.stringify(normalizedAction.payload), normalizedAction.summary.trim(), expiresAt, createdAt)
  return toPublic(getDatabase().prepare('SELECT * FROM chat_action_requests WHERE id = ?').get(id))
}

export function cancelActionRequest(id, userId) {
  const result = getDatabase().prepare(`
    UPDATE chat_action_requests SET status = 'cancelled'
    WHERE id = ? AND user_id = ? AND status = 'pending' AND expires_at > ?
  `).run(id, userId, now())
  return result.changes > 0
}

export function getActionRequest(id, userId) {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM chat_action_requests WHERE id = ? AND user_id = ?').get(id, userId)
  if (!row) return null
  if (row.status === 'pending' && row.expires_at <= now()) {
    db.prepare("UPDATE chat_action_requests SET status = 'expired' WHERE id = ?").run(id)
    row.status = 'expired'
  }
  return toPublic(row)
}

export function completeActionRequest(id, userId, result) {
  const db = getDatabase()
  const request = db.prepare(`
    SELECT * FROM chat_action_requests WHERE id = ? AND user_id = ?
  `).get(id, userId)
  if (!request) return { error: 'not_found' }
  if (request.status === 'confirmed') return { request: toPublic(request), repeated: true }
  if (request.status !== 'pending' || request.expires_at <= now()) {
    if (request.status === 'pending') db.prepare("UPDATE chat_action_requests SET status = 'expired' WHERE id = ?").run(id)
    return { error: 'unavailable' }
  }

  const confirmedAt = now()
  db.transaction(() => {
    db.prepare(`UPDATE chat_action_requests SET status = 'confirmed', result = ?, confirmed_at = ? WHERE id = ?`)
      .run(JSON.stringify(result), confirmedAt, id)
    db.prepare(`INSERT INTO chat_action_audit (request_id, user_id, action_type, status, created_at) VALUES (?, ?, ?, 'confirmed', ?)`)
      .run(id, userId, request.action_type, confirmedAt)
  })()
  return { request: getActionRequest(id, userId), repeated: false }
}

function requireInteger(value, message, { min = 1 } = {}) {
  if (!Number.isInteger(value) || value < min) throw new Error(message)
  return value
}

function requireText(value, message, max) {
  if (typeof value !== 'string' || !value.trim() || (max && value.trim().length > max)) throw new Error(message)
  return value.trim()
}

function executeAction(userId, type, payload) {
  const db = getDatabase()
  if (type === 'create_transaction' || type === 'update_transaction') {
    if (!['income', 'expense'].includes(payload.type)) throw new Error('El tipo de transacción no es válido')
    const amount = requireInteger(payload.amount, 'El monto debe ser un número entero positivo (en centavos)')
    const date = typeof payload.date === 'string' && payload.date.trim() ? payload.date.trim() : today()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('La fecha debe tener formato AAAA-MM-DD')
    const category = typeof payload.category === 'string' && payload.category.trim() ? payload.category.trim() : null
    if (category && !db.prepare('SELECT 1 FROM categories WHERE user_id = ? AND lower(name) = lower(?)').get(userId, category)) throw new Error('La categoría no existe en tu catálogo')
    const value = { type: payload.type, amount, date, description: typeof payload.description === 'string' ? payload.description.slice(0, 255) : null, category }
    if (type === 'create_transaction') return { message: 'Transacción creada', data: toPublicTransaction(createTransaction({ userId, ...value })) }
    if (!findTransactionById(payload.id, userId)) throw new Error('Transacción no encontrada')
    return { message: 'Transacción actualizada', data: toPublicTransaction(updateTransaction(payload.id, userId, value)) }
  }
  if (type === 'delete_transaction') {
    if (!deleteTransaction(payload.id, userId).changes) throw new Error('Transacción no encontrada')
    return { message: 'Transacción eliminada' }
  }
  if (type === 'create_category' || type === 'update_category') {
    const name = requireText(payload.name, 'El nombre de la categoría no es válido', 32)
    if (!['income', 'expense'].includes(payload.type)) throw new Error('El tipo de categoría no es válido')
    const palette = ['#6366f1', '#8b5cf6', '#a78bfa', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899', '#14b8a6', '#f97316']
    if (!palette.includes(payload.color)) throw new Error('Color no válido')
    if (type === 'create_category') return { message: 'Categoría creada', data: createCategory({ userId, name, type: payload.type, color: payload.color }) }
    if (!findCategoryById(payload.id, userId)) throw new Error('Categoría no encontrada')
    return { message: 'Categoría actualizada', data: updateCategory(payload.id, userId, { name, type: payload.type, color: payload.color }) }
  }
  if (type === 'delete_category') {
    if (!findCategoryById(payload.id, userId)) throw new Error('Categoría no encontrada')
    if (deleteCategory(payload.id, userId)) throw new Error('No se puede eliminar: la categoría está en uso')
    return { message: 'Categoría eliminada' }
  }
  if (type === 'create_budget' || type === 'update_budget') {
    const category = requireText(payload.category, 'La categoría es obligatoria', 32)
    const month = requireText(payload.month, 'El mes debe tener formato AAAA-MM')
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('El mes debe tener formato AAAA-MM')
    const amount = requireInteger(payload.amount, 'El monto debe ser un número entero positivo (en centavos)')
    const threshold = payload.threshold === undefined ? 80 : requireInteger(payload.threshold, 'El umbral debe ser un número entero entre 1 y 100')
    if (threshold > 100 || !db.prepare("SELECT 1 FROM categories WHERE user_id = ? AND lower(name) = lower(?) AND type = 'expense'").get(userId, category)) throw new Error('La categoría no existe en tu catálogo o no es de tipo gasto')
    const value = { category, month, amount, threshold }
    if (type === 'create_budget') return { message: 'Presupuesto creado', data: toPublicBudget(createBudget({ userId, ...value })) }
    if (!findBudgetById(payload.id, userId)) throw new Error('Presupuesto no encontrado')
    return { message: 'Presupuesto actualizado', data: toPublicBudget(updateBudget(payload.id, userId, value)) }
  }
  if (type === 'delete_budget') {
    if (!deleteBudget(payload.id, userId).changes) throw new Error('Presupuesto no encontrado')
    return { message: 'Presupuesto eliminado' }
  }
  if (type === 'create_goal' || type === 'update_goal') {
    const value = { name: requireText(payload.name, 'El nombre es obligatorio', 80), targetAmount: requireInteger(payload.targetAmount, 'El monto objetivo debe ser un número entero positivo (en centavos)'), savedAmount: requireInteger(payload.savedAmount ?? 0, 'El monto ahorrado debe ser un número entero no negativo (en centavos)', { min: 0 }), deadline: payload.deadline || null }
    if (value.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(value.deadline)) throw new Error('La fecha límite debe tener formato AAAA-MM-DD')
    if (type === 'create_goal') return { message: 'Meta creada', data: toPublicGoal(createGoal({ userId, ...value })) }
    if (!findGoalById(payload.id, userId)) throw new Error('Meta de ahorro no encontrada')
    return { message: 'Meta actualizada', data: toPublicGoal(updateGoal(payload.id, userId, value)) }
  }
  if (type === 'delete_goal') {
    if (!deleteGoal(payload.id, userId).changes) throw new Error('Meta de ahorro no encontrada')
    return { message: 'Meta eliminada' }
  }
  if (type === 'adjust_goal') {
    if (!['contribute', 'withdraw'].includes(payload.type)) throw new Error('Tipo de movimiento no válido')
    const result = adjustGoalWithTransaction(userId, payload.id, requireInteger(payload.amount, 'Monto no válido'), payload.type)
    return { message: 'Meta actualizada', data: toPublicGoal(result.goal) }
  }
  if (type === 'mark_alert_read') {
    if (!db.prepare('UPDATE alerts SET read = 1 WHERE id = ? AND user_id = ?').run(payload.id, userId).changes) throw new Error('Alerta no encontrada')
    return { message: 'Alerta marcada como leída' }
  }
  if (type === 'mark_all_alerts_read') {
    db.prepare('UPDATE alerts SET read = 1 WHERE user_id = ? AND read = 0').run(userId)
    return { message: 'Todas las alertas fueron marcadas como leídas' }
  }
  if (type === 'export_transactions') return { message: 'Exportación lista para descargar', download: { format: payload.format, params: payload.params || {} } }
  throw new Error('Acción no soportada')
}

export function confirmActionRequest(id, userId) {
  const db = getDatabase()
  return db.transaction(() => {
    const request = db.prepare('SELECT * FROM chat_action_requests WHERE id = ? AND user_id = ?').get(id, userId)
    if (!request) return { error: 'not_found' }
    if (request.status === 'confirmed') return { request: toPublic(request), repeated: true }
    if (request.status !== 'pending' || request.expires_at <= now()) return { error: 'unavailable' }
    const result = executeAction(userId, request.action_type, JSON.parse(request.payload))
    const confirmedAt = now()
    db.prepare("UPDATE chat_action_requests SET status = 'confirmed', result = ?, confirmed_at = ? WHERE id = ?").run(JSON.stringify(result), confirmedAt, id)
    db.prepare("INSERT INTO chat_action_audit (request_id, user_id, action_type, status, created_at) VALUES (?, ?, ?, 'confirmed', ?)").run(id, userId, request.action_type, confirmedAt)
    return { request: getActionRequest(id, userId), repeated: false }
  })()
}
