import { getTursoClient } from './turso.js'

const LIST_QUERY = 'SELECT * FROM goals WHERE user_id = ?'
const COUNT_QUERY = 'SELECT COUNT(*) as count FROM goals WHERE user_id = ?'
const ORDER_BY = ' ORDER BY created_at DESC, id DESC'

function normalizeGoal(row) {
  if (!row) return undefined
  return { ...row, id: Number(row.id), user_id: Number(row.user_id), target_amount: Number(row.target_amount), saved_amount: Number(row.saved_amount) }
}

export async function listGoals(userId, { limit = 50, offset = 0 } = {}) {
  const lim = Math.min(parseInt(limit) || 50, 200)
  const off = parseInt(offset) || 0
  const client = getTursoClient()
  const dataResult = await client.execute({ sql: `${LIST_QUERY}${ORDER_BY} LIMIT ? OFFSET ?`, args: [userId, lim, off] })
  const countResult = await client.execute({ sql: COUNT_QUERY, args: [userId] })
  return { data: dataResult.rows.map(normalizeGoal).map(toPublicGoal), total: Number(countResult.rows[0]?.count ?? 0), limit: lim, offset: off }
}

export async function countGoals(userId) {
  const result = await getTursoClient().execute({ sql: COUNT_QUERY, args: [userId] })
  return Number(result.rows[0]?.count ?? 0)
}

export async function findGoalById(id, userId) {
  const result = await getTursoClient().execute({ sql: 'SELECT * FROM goals WHERE id = ? AND user_id = ?', args: [id, userId] })
  return normalizeGoal(result.rows[0])
}

export async function createGoal({ userId, name, targetAmount, savedAmount, deadline }) {
  const createdAt = new Date().toISOString().slice(0, 10)
  const result = await getTursoClient().execute({
    sql: 'INSERT INTO goals (user_id, name, target_amount, saved_amount, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [userId, name, targetAmount, savedAmount, deadline, createdAt]
  })
  return findGoalById(Number(result.lastInsertRowid), userId)
}

export async function updateGoal(id, userId, { name, targetAmount, savedAmount, deadline }) {
  await getTursoClient().execute({
    sql: 'UPDATE goals SET name = ?, target_amount = ?, saved_amount = ?, deadline = ? WHERE id = ? AND user_id = ?',
    args: [name, targetAmount, savedAmount, deadline, id, userId]
  })
  return findGoalById(id, userId)
}

export async function deleteGoal(id, userId) {
  return getTursoClient().execute({ sql: 'DELETE FROM goals WHERE id = ? AND user_id = ?', args: [id, userId] })
}

export async function adjustGoalWithTransaction(userId, goalId, delta, movementType) {
  const client = getTursoClient()
  const result = await client.execute({ sql: 'SELECT * FROM goals WHERE id = ? AND user_id = ?', args: [goalId, userId] })
  const goal = normalizeGoal(result.rows[0])
  if (!goal) {
    const err = new Error('Meta no encontrada')
    err.status = 404
    throw err
  }
  if (movementType === 'withdraw' && Number(goal.saved_amount) < delta) {
    const err = new Error('Fondos insuficientes en la meta')
    err.status = 400
    throw err
  }

  const newSaved = movementType === 'contribute'
    ? Number(goal.saved_amount) + delta
    : Number(goal.saved_amount) - delta
  const txnType = movementType === 'contribute' ? 'expense' : 'income'
  const description = movementType === 'contribute'
    ? `Aporte a meta: ${goal.name}`
    : `Retiro de meta: ${goal.name}`
  const today = new Date().toISOString().slice(0, 10)

  await client.batch([
    { sql: 'UPDATE goals SET saved_amount = ? WHERE id = ? AND user_id = ?', args: [newSaved, goalId, userId] },
    { sql: 'INSERT INTO transactions (user_id, type, amount, date, description, category, goal_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', args: [userId, txnType, delta, today, description, null, goalId, today] }
  ], 'write')

  return { goal: { ...goal, saved_amount: newSaved }, transactionId: null }
}

export function toPublicGoal(goal) {
  return {
    id: Number(goal.id),
    name: goal.name,
    targetAmount: Number(goal.target_amount),
    savedAmount: Number(goal.saved_amount),
    deadline: goal.deadline ?? null,
    createdAt: goal.created_at
  }
}