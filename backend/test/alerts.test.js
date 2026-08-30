import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app.js'
import { getDatabase } from '../src/db.js'

let server
let baseUrl

beforeEach(async () => {
  getDatabase().prepare('DELETE FROM alerts').run()
  getDatabase().prepare('DELETE FROM budgets').run()
  getDatabase().prepare('DELETE FROM transactions').run()
  getDatabase().prepare('DELETE FROM categories').run()
  getDatabase().prepare('DELETE FROM users').run()
  server = app.listen(0)
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve))
})

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  return { status: response.status, body: response.status === 204 ? null : await response.json() }
}

function getData(response) {
  if (!response) return response
  if (response.body && response.body.data !== undefined) {
    return response.body.data
  }
  if (response.data !== undefined) {
    return response.data
  }
  return response
}

async function registerAndLogin({ username = 'rama', email = 'rama@example.com' } = {}) {
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

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const MONTH = currentMonth()

async function ensureCategory(token, name, type = 'expense', color = '#ef4444') {
  const { status } = await request('/api/categories', {
    method: 'POST',
    body: { name, type, color },
    token
  })
  if (status !== 201 && status !== 400) {
    throw new Error(`Failed to create category: ${status}`)
  }
}

async function createBudget(token, overrides) {
  const category = overrides?.category ?? 'Comida'
  if (String(category).trim() !== '' && String(category).length <= 32) {
    await ensureCategory(token, String(category).trim(), 'expense')
  }
  return request('/api/budgets', {
    method: 'POST',
    body: { category, month: MONTH, amount: 100000, ...overrides },
    token
  })
}

async function createExpense(token, category, amount) {
  if (String(category).trim() !== '' && String(category).length <= 32) {
    await ensureCategory(token, String(category).trim(), 'expense')
  }
  return request('/api/transactions', {
    method: 'POST',
    body: { type: 'expense', amount, date: `${MONTH}-10`, category },
    token
  })
}

async function checkAlerts(token, month) {
  return request('/api/alerts/check', { method: 'POST', body: { month }, token })
}

describe('verificación y generación de alertas', () => {
  it('genera una alerta warning al alcanzar el umbral sin superarlo', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { amount: 100000, threshold: 80 })
    await createExpense(token, 'Comida', 80000)

    const { status, body } = await checkAlerts(token, MONTH)

    expect(status).toBe(201)
    expect(body.created).toHaveLength(1)
    expect(body.created[0]).toMatchObject({ type: 'warning', category: 'Comida', month: MONTH, read: false })
    expect(body.created[0].message).toContain('800,00')
  })

  it('genera una alerta danger al superar el límite y no crea la warning', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { amount: 100000, threshold: 80 })
    await createExpense(token, 'Comida', 120000)

    const { status, body } = await checkAlerts(token, MONTH)

    expect(status).toBe(201)
    expect(body.created).toHaveLength(1)
    expect(body.created[0].type).toBe('danger')
    expect(body.created[0].message).toContain('Presupuesto excedido')
  })

  it('no genera alertas por debajo del umbral', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { amount: 100000 })
    await createExpense(token, 'Comida', 50000)

    const { status, body } = await checkAlerts(token, MONTH)

    expect(status).toBe(201)
    expect(body.created).toEqual([])
  })

  it('no duplica alertas en una verificación repetida', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { amount: 100000 })
    await createExpense(token, 'Comida', 90000)

    const first = await checkAlerts(token, MONTH)
    const second = await checkAlerts(token, MONTH)

    expect(first.body.created).toHaveLength(1)
    expect(second.body.created).toEqual([])
  })

  it('usa el mes actual cuando no se envía month', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { amount: 100000 })
    await createExpense(token, 'Comida', 100000)

    const { status, body } = await request('/api/alerts/check', { method: 'POST', token })

    expect(status).toBe(201)
    expect(body.created[0].month).toBe(MONTH)
  })

  it('rechaza un mes con formato inválido', async () => {
    const token = await registerAndLogin()

    const { status, body } = await checkAlerts(token, '08-2026')

    expect(status).toBe(400)
    expect(body.error).toBe('El mes debe tener formato AAAA-MM')
  })

  it('respeta el umbral personalizado del presupuesto', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { amount: 100000, threshold: 50 })
    await createExpense(token, 'Comida', 60000)

    const { body } = await checkAlerts(token, MONTH)

    expect(body.created).toHaveLength(1)
    expect(body.created[0].type).toBe('warning')
  })

  it('no cruza presupuestos ni gastos entre usuarios', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    await createBudget(tokenA, { amount: 100000 })
    await createExpense(tokenB, 'Comida', 999999)

    const { body } = await checkAlerts(tokenB, MONTH)
    const listing = await request('/api/alerts', { token: tokenB })

    expect(body.created).toEqual([])
    expect(listing.body).toEqual([])
  })
})

describe('listado de alertas', () => {
  it('lista las propias ordenadas de más reciente a más antigua', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { category: 'Comida', amount: 100000 })
    await createBudget(token, { category: 'Transporte', amount: 100000 })
    await createExpense(token, 'Comida', 90000)

    await checkAlerts(token, MONTH)
    await createExpense(token, 'Transporte', 95000)
    await checkAlerts(token, MONTH)

    const { status, body } = await request('/api/alerts', { token })

    expect(status).toBe(200)
    expect(getData(body)).toHaveLength(2)
    expect(Date.parse(getData(body)[0].createdAt)).toBeGreaterThanOrEqual(Date.parse(getData(body)[1].createdAt))
  })
})

describe('control de lectura de alertas', () => {
  it('marca una alerta propia como leída', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { amount: 100000 })
    await createExpense(token, 'Comida', 90000)
    const { body: alertBody } = await checkAlerts(token, MONTH)

    const { status } = await request(`/api/alerts/${alertBody.created[0].id}/read`, {
      method: 'PUT',
      token
    })
    const { body: after } = await request('/api/alerts', { token })

    expect(status).toBe(200)
    expect(getData(after)[0].read).toBe(true)
  })

  it('marca todas las alertas como leídas', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { category: 'Comida', amount: 100000 })
    await createBudget(token, { category: 'Transporte', amount: 100000 })
    await createExpense(token, 'Comida', 90000)
    await createExpense(token, 'Transporte', 95000)
    await checkAlerts(token, MONTH)

    const { status } = await request('/api/alerts/read-all', { method: 'POST', token })
    const { body: after } = await request('/api/alerts', { token })

    expect(status).toBe(200)
    expect(getData(after)).toHaveLength(2)
    expect(getData(after).every((alert) => alert.read)).toBe(true)
  })

  it('responde 404 ante una alerta ajena o inexistente', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    await createBudget(tokenA, { amount: 100000 })
    await createExpense(tokenA, 'Comida', 90000)
    const { body } = await checkAlerts(tokenA, MONTH)

    const responses = await Promise.all([
      request(`/api/alerts/${body.created[0].id}/read`, { method: 'PUT', token: tokenB }),
      request('/api/alerts/id-inexistente/read', { method: 'PUT', token: tokenB })
    ])

    for (const response of responses) {
      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Alerta no encontrada')
    }
  })
})

describe('autenticación de alertas', () => {
  it('responde 401 sin token en todas las operaciones', async () => {
    const operations = [
      request('/api/alerts'),
      request('/api/alerts/check', { method: 'POST' }),
      request('/api/alerts/x/read', { method: 'PUT' }),
      request('/api/alerts/read-all', { method: 'POST' })
    ]

    const responses = await Promise.all(operations)

    for (const response of responses) {
      expect(response.status).toBe(401)
    }
  })
})
