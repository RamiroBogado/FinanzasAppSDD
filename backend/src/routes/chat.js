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

const PROMPT_INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /system prompt/i,
  /jailbreak/i,
  /override/i,
  /disregard previous/i,
  /forget everything/i,
  /new instructions/i,
]

function containsPromptInjection(message) {
  return PROMPT_INJECTION_PATTERNS.some(pattern => pattern.test(message))
}

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

  if (message.length > 2000) {
    return res.status(400).json({ error: 'El mensaje no puede superar 2000 caracteres' })
  }

  if (containsPromptInjection(message)) {
    return res.status(400).json({ error: 'Mensaje no válido' })
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
    console.log(JSON.stringify({
      userId: req.userId,
      ts: Date.now(),
      len: message.length,
      status: 'error',
      error: 'ai_unavailable'
    }))
    return res.status(502).json({ error: 'El asistente no está disponible en este momento' })
  }

  saveChatTurn({ userId: req.userId, message, reply: data.reply })

  console.log(JSON.stringify({
    userId: req.userId,
    ts: Date.now(),
    len: message.length,
    status: 'ok'
  }))

  return res.json({ reply: data.reply })
})

router.delete('/messages', (req, res) => {
  deleteChatMessages(req.userId)

  res.json({ status: 'ok' })
})

export default router