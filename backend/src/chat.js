import { getTursoClient } from './turso.js'

const MAX_LIST_MESSAGES = 200
const HISTORY_TURNS = 10

export async function listChatMessages(userId) {
  const result = await getTursoClient().execute({
    sql: `SELECT id, role, content, created_at FROM (
      SELECT id, role, content, created_at FROM chat_messages
      WHERE user_id = ? ORDER BY id DESC LIMIT ?
    ) ORDER BY id ASC`,
    args: [userId, MAX_LIST_MESSAGES]
  })
  return result.rows.map(row => ({ ...row, id: Number(row.id) }))
}

export async function recentChatHistory(userId) {
  const result = await getTursoClient().execute({
    sql: 'SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?',
    args: [userId, HISTORY_TURNS * 2]
  })
  return result.rows.reverse()
}

export async function saveChatTurn({ userId, message, reply }) {
  const createdAt = new Date().toISOString()
  await getTursoClient().batch([
    { sql: 'INSERT INTO chat_messages (user_id, role, content, created_at) VALUES (?, ?, ?, ?)', args: [userId, 'user', message, createdAt] },
    { sql: 'INSERT INTO chat_messages (user_id, role, content, created_at) VALUES (?, ?, ?, ?)', args: [userId, 'assistant', reply, createdAt] }
  ], 'write')
}

export async function deleteChatMessages(userId) {
  await getTursoClient().execute({ sql: 'DELETE FROM chat_messages WHERE user_id = ?', args: [userId] })
}