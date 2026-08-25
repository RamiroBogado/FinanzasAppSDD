import { Router } from 'express'
import { aiServiceUrl } from '../config.js'
import {
  deleteChatMessages,
  listChatMessages,
  recentChatHistory,
  saveChatTurn
} from '../chat.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.use(requireAuth)

router.get('/messages', (req, res) => {
  res.json(listChatMessages(req.userId))
})

router.post('/messages', async (req, res) => {
  const rawMessage = req.body?.message
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : ''

  if (!message) {
    return res.status(400).json({ error: 'El mensaje es obligatorio y no puede estar vacío' })
  }

  const history = recentChatHistory(req.userId)

  let response

  try {
    response = await fetch(`${aiServiceUrl}/ai/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      body: JSON.stringify({ message, history })
    })
  } catch {
    return res.status(502).json({ error: 'El asistente no está disponible en este momento' })
  }

  const data = await response.json().catch(() => null)

  if (!response.ok || !data || typeof data.reply !== 'string') {
    return res.status(502).json({ error: 'El asistente no está disponible en este momento' })
  }

  saveChatTurn({ userId: req.userId, message, reply: data.reply })

  return res.json({ reply: data.reply })
})

router.delete('/messages', (req, res) => {
  deleteChatMessages(req.userId)

  res.json({ status: 'ok' })
})

export default router
