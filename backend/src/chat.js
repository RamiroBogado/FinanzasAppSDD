import { getDatabase } from './db.js'

const MAX_LIST_MESSAGES = 200
const HISTORY_TURNS = 10

export function listChatMessages(userId) {
  return getDatabase()
    .prepare(
      `SELECT id, role, content, created_at FROM (
         SELECT id, role, content, created_at FROM chat_messages
         WHERE user_id = ? ORDER BY id DESC LIMIT ?
       ) ORDER BY id ASC`
    )
    .all(userId, MAX_LIST_MESSAGES)
}

export function recentChatHistory(userId) {
  const rows = getDatabase()
    .prepare(
      'SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?'
    )
    .all(userId, HISTORY_TURNS * 2)

  return rows.reverse()
}

export function saveChatTurn({ userId, message, reply }) {
  const createdAt = new Date().toISOString()
  const insert = getDatabase().prepare(
    'INSERT INTO chat_messages (user_id, role, content, created_at) VALUES (?, ?, ?, ?)'
  )

  getDatabase().transaction(() => {
    insert.run(userId, 'user', message, createdAt)
    insert.run(userId, 'assistant', reply, createdAt)
  })()
}

export function deleteChatMessages(userId) {
  getDatabase().prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userId)
}
