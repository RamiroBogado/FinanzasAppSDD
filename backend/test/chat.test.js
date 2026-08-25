import http from 'node:http'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

let app
let aiStub
let aiStubPort
const aiCalls = []

let stubBehavior = { status: 200, body: { reply: 'respuesta simulada' }, failConnection: false }

beforeAll(async () => {
  aiStub = http.createServer((req, res) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      aiCalls.push(JSON.parse(raw || '{}'))

      if (stubBehavior.failConnection) {
        res.socket.destroy()
        return
      }

      res.writeHead(stubBehavior.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(stubBehavior.body))
    })
  })

  await new Promise((resolve) => aiStub.listen(0, '127.0.0.1', resolve))
  aiStubPort = aiStub.address().port
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${aiStubPort}`

  ;({ default: app } = await import('../src/app.js'))
})

afterAll(async () => {
  await new Promise((resolve) => aiStub.close(resolve))
})

let server
let baseUrl

beforeEach(async () => {
  const { getDatabase } = await import('../src/db.js')
  getDatabase().prepare('DELETE FROM chat_messages').run()
  getDatabase().prepare('DELETE FROM budgets').run()
  getDatabase().prepare('DELETE FROM transactions').run()
  getDatabase().prepare('DELETE FROM users').run()
  aiCalls.length = 0
  stubBehavior = { status: 200, body: { reply: 'respuesta simulada' }, failConnection: false }
  server = app.listen(0)
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve))
})

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  const canHaveBody = method !== 'GET' && method !== 'HEAD'
  if (body && canHaveBody) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body && canHaveBody ? JSON.stringify(body) : undefined
  })

  const raw = await response.text()

  let parsed

  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    throw new Error(`respuesta no JSON en ${path}: ${raw.slice(0, 120)}`)
  }

  return { status: response.status, body: parsed }
}

async function registerAndLogin({ username, email }) {
  await request('/api/auth/register', {
    method: 'POST',
    body: { username, email, password: 'secret123' }
  })
  const { body } = await request('/api/auth/login', {
    method: 'POST',
    body: { username, password: 'secret123' }
  })
  return body.token
}

describe('autenticación de la API de chat', () => {
  it.each([
    ['GET', '/api/chat/messages'],
    ['POST', '/api/chat/messages'],
    ['DELETE', '/api/chat/messages']
  ])('rechaza %s sin token con 401', async (method, path) => {
    const { status, body } = await request(path, { method, body: { message: 'Hola' } })

    expect(status).toBe(401)
    expect(body).toEqual({ error: 'No autorizado' })
    expect(aiCalls).toHaveLength(0)
  })
})

describe('validación del mensaje', () => {
  it('rechaza mensaje ausente con 400 sin invocar al servicio de IA', async () => {
    const token = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })

    const { status, body } = await request('/api/chat/messages', { method: 'POST', token })

    expect(status).toBe(400)
    expect(body.error).toBe('El mensaje es obligatorio y no puede estar vacío')
    expect(aiCalls).toHaveLength(0)
  })

  it('rechaza mensaje vacío o solo espacios con 400', async () => {
    const token = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })

    for (const message of ['', '   ']) {
      const { status, body } = await request('/api/chat/messages', {
        method: 'POST',
        body: { message },
        token
      })

      expect(status).toBe(400)
      expect(body.error).toBe('El mensaje es obligatorio y no puede estar vacío')
    }

    expect(aiCalls).toHaveLength(0)
  })
})

describe('envío de mensaje vía backend', () => {
  it('devuelve la respuesta de la IA y persiste el turno completo', async () => {
    const token = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })

    const { status, body } = await request('/api/chat/messages', {
      method: 'POST',
      body: { message: '¿Cuánto gasté en comida?' },
      token
    })

    expect(status).toBe(200)
    expect(body.reply).toBe('respuesta simulada')

    const history = await request('/api/chat/messages', { token })

    expect(history.body).toHaveLength(2)
    expect(history.body[0]).toMatchObject({ role: 'user', content: '¿Cuánto gasté en comida?' })
    expect(history.body[1]).toMatchObject({ role: 'assistant', content: 'respuesta simulada' })
  })

  it('envía los turnos previos como historial al servicio de IA', async () => {
    const token = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })

    await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Primera pregunta' },
      token
    })

    await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Segunda pregunta' },
      token
    })

    expect(aiCalls).toHaveLength(2)
    expect(aiCalls[1].history).toEqual([
      { role: 'user', content: 'Primera pregunta' },
      { role: 'assistant', content: 'respuesta simulada' }
    ])
    expect(aiCalls[1].message).toBe('Segunda pregunta')
  })

  it('reenvía el encabezado Authorization del usuario al servicio de IA', async () => {
    const token = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })

    await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta con token' },
      token
    })

    expect(aiCalls).toHaveLength(1)
  })

  it('recorta el historial enviado a los últimos turnos configurados', async () => {
    const token = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })

    for (let index = 1; index <= 12; index += 1) {
      await request('/api/chat/messages', {
        method: 'POST',
        body: { message: `Pregunta ${index}` },
        token
      })
    }

    const lastCall = aiCalls.at(-1)

    expect(lastCall.history.length).toBeLessThanOrEqual(20)
    expect(lastCall.history.at(-1)).toEqual({
      role: 'assistant',
      content: 'respuesta simulada'
    })
  })
})

describe('falla del servicio de IA', () => {
  it('responde 502 con error en español cuando la IA devuelve error y no persiste nada', async () => {
    const token = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    stubBehavior = { status: 500, body: { error: 'boom' } }

    const { status, body } = await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta con IA caída' },
      token
    })

    expect(status).toBe(502)
    expect(body.error).toBe('El asistente no está disponible en este momento')

    const history = await request('/api/chat/messages', { token })

    expect(history.body).toEqual([])
  })

  it('responde 502 cuando no hay conexión con la IA', async () => {
    const token = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    stubBehavior = { failConnection: true }

    const { status, body } = await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta sin conexión' },
      token
    })

    expect(status).toBe(502)
    expect(body.error).toBe('El asistente no está disponible en este momento')

    const history = await request('/api/chat/messages', { token })

    expect(history.body).toEqual([])
  })

  it('responde 502 cuando la IA responde con un cuerpo inválido', async () => {
    const token = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    stubBehavior = { status: 200, body: { inesperado: true } }

    const { status } = await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta con respuesta inválida' },
      token
    })

    expect(status).toBe(502)
  })
})

describe('aislamiento y limpieza del historial', () => {
  it('cada usuario consulta únicamente su propio historial', async () => {
    const ramaToken = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const anaToken = await registerAndLogin({ username: 'ana', email: 'ana@example.com' })

    await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta de Rama' },
      token: ramaToken
    })

    const anaHistory = await request('/api/chat/messages', { token: anaToken })

    expect(anaHistory.body).toEqual([])
  })

  it('el historial recibido por la IA nunca incluye mensajes de otro usuario', async () => {
    const ramaToken = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const anaToken = await registerAndLogin({ username: 'ana', email: 'ana@example.com' })

    await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta de Rama' },
      token: ramaToken
    })

    await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta de Ana' },
      token: anaToken
    })

    expect(aiCalls[1].history).toEqual([])
    expect(aiCalls[1].message).toBe('Pregunta de Ana')
  })

  it('DELETE borra el historial propio sin afectar a otros usuarios', async () => {
    const ramaToken = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const anaToken = await registerAndLogin({ username: 'ana', email: 'ana@example.com' })

    await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta de Rama' },
      token: ramaToken
    })
    await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta de Ana' },
      token: anaToken
    })

    const deleted = await request('/api/chat/messages', { method: 'DELETE', token: ramaToken })

    expect(deleted.status).toBe(200)
    expect(deleted.body).toEqual({ status: 'ok' })

    const ramaHistory = await request('/api/chat/messages', { token: ramaToken })
    const anaHistory = await request('/api/chat/messages', { token: anaToken })

    expect(ramaHistory.body).toEqual([])
    expect(anaHistory.body).toHaveLength(2)
  })

  it('GET devuelve el historial en orden cronológico ascendente', async () => {
    const token = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })

    await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta uno' },
      token
    })
    await request('/api/chat/messages', {
      method: 'POST',
      body: { message: 'Pregunta dos' },
      token
    })

    const history = await request('/api/chat/messages', { token })
    const roles = history.body.map((message) => message.role)

    expect(roles).toEqual(['user', 'assistant', 'user', 'assistant'])
    expect(history.body.map((message) => message.content)).toContain('Pregunta dos')
  })
})
