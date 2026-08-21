import { getDatabase } from './db.js'

const LIST_QUERY = 'SELECT * FROM goals WHERE user_id = ?'

const ORDER_BY = ' ORDER BY created_at DESC, id DESC'

export function listGoals(userId) {
  return getDatabase().prepare(`${LIST_QUERY}${ORDER_BY}`).all(userId)
}

export function findGoalById(id, userId) {
  return getDatabase().prepare(`${LIST_QUERY} AND id = ?`).get(userId, id)
}

export function createGoal({ userId, name, targetAmount, savedAmount, deadline }) {
  const createdAt = new Date().toISOString().slice(0, 10)
  const result = getDatabase()
    .prepare(
      'INSERT INTO goals (user_id, name, target_amount, saved_amount, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(userId, name, targetAmount, savedAmount, deadline, createdAt)

  return findGoalById(result.lastInsertRowid, userId)
}

export function updateGoal(id, userId, { name, targetAmount, savedAmount, deadline }) {
  getDatabase()
    .prepare(
      'UPDATE goals SET name = ?, target_amount = ?, saved_amount = ?, deadline = ? WHERE id = ? AND user_id = ?'
    )
    .run(name, targetAmount, savedAmount, deadline, id, userId)

  return findGoalById(id, userId)
}

export function deleteGoal(id, userId) {
  return getDatabase().prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(id, userId)
}

export function toPublicGoal(goal) {
  return {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.target_amount,
    savedAmount: goal.saved_amount,
    deadline: goal.deadline ?? null,
    createdAt: goal.created_at
  }
}
