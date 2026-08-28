import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app.js'
import { getDatabase } from '../src/db.js'

let server
let baseUrl

beforeEach(async () => {
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

function validTransaction(overrides = {}) {
  return {
    type: 'expense',
    amount: 12500,
    date: '2026-08-20',
    description: 'Supermercado',
    ...overrides
  }
}

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

async function createTransaction(token, overrides) {
  const category = overrides?.category
  if (
    category !== undefined &&
    category !== null &&
    String(category).trim() !== '' &&
    String(category).length <= 32
  ) {
    await ensureCategory(token, String(category).trim(), overrides.type || 'expense')
  }
  return request('/api/transactions', {
    method: 'POST',
    body: validTransaction(overrides),
    token
  })
}

describe('creación de transacciones', () => {
  it('crea una transacción válida y responde 201 con sus datos', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createTransaction(token)

    expect(status).toBe(201)
    expect(body).toMatchObject({
      type: 'expense',
      amount: 12500,
      date: '2026-08-20',
      description: 'Supermercado'
    })
    expect(typeof body.id).toBe('number')
  })

  it('asigna la fecha actual cuando no se envía date', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createTransaction(token, { date: undefined })

    expect(status).toBe(201)
    expect(body.date).toBe(new Date().toISOString().slice(0, 10))
  })

  it('rechaza un tipo inválido', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createTransaction(token, { type: 'transferencia' })

    expect(status).toBe(400)
    expect(body.error).toBe('El tipo de transacción debe ser income o expense')
  })

  it('rechaza montos no enteros positivos', async () => {
    const token = await registerAndLogin()

    for (const amount of [0, -5, 100.5, 'abc']) {
      const { status, body } = await createTransaction(token, { amount })

      expect(status).toBe(400)
      expect(body.error).toBe('El monto debe ser un número entero positivo (en centavos)')
    }
  })

  it('rechaza una descripción demasiado larga', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createTransaction(token, { description: 'a'.repeat(256) })

    expect(status).toBe(400)
    expect(body.error).toBe('La descripción no puede superar los 255 caracteres')
  })

  it('rechaza una fecha malformada', async () => {
    const token = await registerAndLogin()
    const { status } = await createTransaction(token, { date: '20/08/2026' })

    expect(status).toBe(400)
  })

  it('crea una transacción con categoría', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createTransaction(token, { category: 'Comida' })

    expect(status).toBe(201)
    expect(body.category).toBe('Comida')
  })

  it('rechaza una categoría de más de 32 caracteres', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createTransaction(token, { category: 'a'.repeat(33) })

    expect(status).toBe(400)
    expect(body.error).toBe('La categoría no puede superar los 32 caracteres')
  })

  it('normaliza a null una categoría vacía o con solo espacios', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createTransaction(token, { category: '   ' })

    expect(status).toBe(201)
    expect(body.category).toBeNull()
  })
})

describe('listado de transacciones', () => {
  it('ordena por fecha descendente', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, { date: '2026-08-18' })
    await createTransaction(token, { date: '2026-08-21', type: 'income' })
    await createTransaction(token, { date: '2026-08-19' })

    const { status, body } = await request('/api/transactions', { token })

    expect(status).toBe(200)
    expect(body.map((transaction) => transaction.date)).toEqual([
      '2026-08-21',
      '2026-08-19',
      '2026-08-18'
    ])
  })

  it('filtra por tipo con el parámetro type', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, { type: 'expense' })
    await createTransaction(token, { type: 'income', amount: 50000 })

    const { body } = await request('/api/transactions?type=expense', { token })

    expect(body).toHaveLength(1)
    expect(body[0].type).toBe('expense')
  })

  it('rechaza un filtro de tipo inválido', async () => {
    const token = await registerAndLogin()
    const { status } = await request('/api/transactions?type=transferencia', { token })

    expect(status).toBe(400)
  })

  it('no expone las transacciones de otro usuario', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    await createTransaction(tokenA)

    const { status, body } = await request('/api/transactions', { token: tokenB })

    expect(status).toBe(200)
    expect(body).toEqual([])
  })
})

describe('filtros del listado', () => {
  it('filtra por categoría sin distinguir mayúsculas', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, { category: 'Comida' })
    await createTransaction(token, { category: 'Transporte', description: 'Sube' })
    await createTransaction(token, { type: 'income', amount: 50000, category: 'Sueldo' })

    const { body } = await request('/api/transactions?category=comida', { token })

    expect(body).toHaveLength(1)
    expect(body[0].category).toBe('Comida')
  })

  it('filtra por texto parcial en la descripción sin distinguir mayúsculas', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, { description: 'Supermercado' })
    await createTransaction(token, { description: 'Mercado Libre' })

    const { body } = await request('/api/transactions?q=mercado', { token })

    expect(body).toHaveLength(2)
  })

  it('trata los comodines de LIKE como texto literal', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, { description: 'Suscripción 100% gratis' })
    await createTransaction(token, { description: 'Pago completo' })

    const { body } = await request('/api/transactions?q=100%25', { token })

    expect(body).toHaveLength(1)
  })

  it('filtra por rango de fechas inclusivo', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, { date: '2026-08-01' })
    await createTransaction(token, { date: '2026-08-15' })
    await createTransaction(token, { date: '2026-08-20' })

    const { body } = await request('/api/transactions?from=2026-08-01&to=2026-08-15', { token })

    expect(body).toHaveLength(2)
  })

  it('rechaza fechas inválidas en from y to', async () => {
    const token = await registerAndLogin()
    const responses = await Promise.all([
      request('/api/transactions?from=01-08-2026', { token }),
      request('/api/transactions?to=20/08/2026', { token })
    ])

    for (const response of responses) {
      expect(response.status).toBe(400)
    }
  })

  it('combina varios filtros a la vez', async () => {
    const token = await registerAndLogin()
    await createTransaction(token, {
      category: 'Comida',
      description: 'Supermercado',
      date: '2026-08-10'
    })
    await createTransaction(token, {
      category: 'Comida',
      description: 'Verdulería',
      date: '2026-08-12'
    })
    await createTransaction(token, {
      category: 'Transporte',
      description: 'Supermercado',
      date: '2026-08-10'
    })

    const { body } = await request(
      '/api/transactions?category=comida&q=super&from=2026-08-09&to=2026-08-11',
      { token }
    )

    expect(body).toHaveLength(1)
    expect(body[0].description).toBe('Supermercado')
  })

  it('los filtros no cruzan datos entre usuarios', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    await createTransaction(tokenA, { category: 'Comida', description: 'Supermercado' })
    await createTransaction(tokenB, { category: 'Comida', description: 'Verdulería' })

    const { body } = await request('/api/transactions?category=comida', { token: tokenB })

    expect(body).toHaveLength(1)
    expect(body[0].description).toBe('Verdulería')
  })
})

describe('consulta de una transacción', () => {
  it('devuelve una transacción propia', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createTransaction(token)

    const { status, body } = await request(`/api/transactions/${created.id}`, { token })

    expect(status).toBe(200)
    expect(body).toMatchObject({ id: created.id, amount: 12500 })
  })

  it('responde 404 ante una transacción de otro usuario', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    const { body: created } = await createTransaction(tokenA)

    const { status, body } = await request(`/api/transactions/${created.id}`, { token: tokenB })

    expect(status).toBe(404)
    expect(body.error).toBe('Transacción no encontrada')
  })

  it('responde 404 ante un id inexistente', async () => {
    const token = await registerAndLogin()

    const { status, body } = await request('/api/transactions/99999', { token })

    expect(status).toBe(404)
    expect(body.error).toBe('Transacción no encontrada')
  })
})

describe('actualización de transacciones', () => {
  it('modifica una transacción propia', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createTransaction(token)

    const { status, body } = await request(`/api/transactions/${created.id}`, {
      method: 'PUT',
      body: { type: 'income', amount: 80000, date: '2026-08-22', description: 'Sueldo' },
      token
    })

    expect(status).toBe(200)
    expect(body).toMatchObject({ id: created.id, type: 'income', amount: 80000, date: '2026-08-22' })
  })

  it('modifica la categoría de una transacción propia', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createTransaction(token, { category: 'Comida' })
    await ensureCategory(token, 'Salud')

    const { status, body } = await request(`/api/transactions/${created.id}`, {
      method: 'PUT',
      body: validTransaction({ category: 'Salud' }),
      token
    })

    expect(status).toBe(200)
    expect(body.category).toBe('Salud')
  })

  it('no modifica la transacción con datos inválidos', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createTransaction(token)

    const { status } = await request(`/api/transactions/${created.id}`, {
      method: 'PUT',
      body: { type: 'expense', amount: -1, date: '2026-08-20' },
      token
    })
    const { body: after } = await request(`/api/transactions/${created.id}`, { token })

    expect(status).toBe(400)
    expect(after.amount).toBe(12500)
  })

  it('responde 404 al modificar una transacción ajena', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    const { body: created } = await createTransaction(tokenA)

    const { status, body } = await request(`/api/transactions/${created.id}`, {
      method: 'PUT',
      body: validTransaction({ amount: 1 }),
      token: tokenB
    })

    expect(status).toBe(404)
    expect(body.error).toBe('Transacción no encontrada')
  })
})

describe('eliminación de transacciones', () => {
  it('elimina una transacción propia', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createTransaction(token)

    const { status } = await request(`/api/transactions/${created.id}`, { method: 'DELETE', token })
    const { body: after } = await request('/api/transactions', { token })

    expect(status).toBe(204)
    expect(after).toEqual([])
  })

  it('responde 404 al eliminar una transacción ajena', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    const { body: created } = await createTransaction(tokenA)

    const { status, body } = await request(`/api/transactions/${created.id}`, {
      method: 'DELETE',
      token: tokenB
    })

    expect(status).toBe(404)
    expect(body.error).toBe('Transacción no encontrada')
  })

  it('responde 404 ante un id inexistente', async () => {
    const token = await registerAndLogin()

    const { status } = await request('/api/transactions/99999', { method: 'DELETE', token })

    expect(status).toBe(404)
  })
})

describe('validación de categorías en transacciones', () => {
  it('crea una transacción con una categoría válida', async () => {
    const token = await registerAndLogin()
    await ensureCategory(token, 'Comida')

    const { status, body } = await createTransaction(token, { category: 'Comida' })

    expect(status).toBe(201)
    expect(body.category).toBe('Comida')
  })

  it('rechaza una transacción con categoría inexistente', async () => {
    const token = await registerAndLogin()

    const { status, body } = await request('/api/transactions', {
      method: 'POST',
      body: validTransaction({ category: 'Inexistente' }),
      token
    })

    expect(status).toBe(400)
    expect(body.error).toBe('La categoría no existe en tu catálogo')
  })

  it('acepta una categoría con diferencia de mayúsculas', async () => {
    const token = await registerAndLogin()
    await ensureCategory(token, 'Comida')

    const { status, body } = await createTransaction(token, { category: 'comida' })

    expect(status).toBe(201)
    expect(body.category).toBe('comida')
  })
})

describe('autenticación de transacciones', () => {
  it('responde 401 sin token en todas las operaciones', async () => {
    const operations = [
      request('/api/transactions', { method: 'POST', body: validTransaction() }),
      request('/api/transactions'),
      request('/api/transactions/1'),
      request('/api/transactions/1', { method: 'PUT', body: validTransaction() }),
      request('/api/transactions/1', { method: 'DELETE' })
    ]

    const responses = await Promise.all(operations)

    for (const response of responses) {
      expect(response.status).toBe(401)
    }
  })

  it('responde 401 con un token inválido', async () => {
    const { status } = await request('/api/transactions', { token: 'token-invalido' })

    expect(status).toBe(401)
  })
})