import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app.js'
import { getDatabase } from '../src/db.js'

let server
let baseUrl

beforeEach(async () => {
  getDatabase().prepare('DELETE FROM budgets').run()
  getDatabase().prepare('DELETE FROM transactions').run()
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

function validBudget(overrides = {}) {
  return {
    category: 'Comida',
    month: '2026-08',
    amount: 100000,
    ...overrides
  }
}

async function createBudget(token, overrides) {
  return request('/api/budgets', { method: 'POST', body: validBudget(overrides), token })
}

async function createExpense(token, category, amount, date) {
  return request('/api/transactions', {
    method: 'POST',
    body: { type: 'expense', amount, date, category },
    token
  })
}

describe('creación de presupuestos', () => {
  it('crea un presupuesto válido y responde 201 con sus datos', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createBudget(token)

    expect(status).toBe(201)
    expect(body).toMatchObject({ category: 'Comida', month: '2026-08', amount: 100000 })
    expect(body.spent).toBe(0)
    expect(typeof body.id).toBe('number')
  })

  it('rechaza una categoría vacía o ausente', async () => {
    const token = await registerAndLogin()

    for (const category of [undefined, null, '', '   ']) {
      const { status, body } = await createBudget(token, { category })

      expect(status).toBe(400)
      expect(body.error).toBe('La categoría es obligatoria')
    }
  })

  it('rechaza una categoría de más de 32 caracteres', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createBudget(token, { category: 'a'.repeat(33) })

    expect(status).toBe(400)
    expect(body.error).toBe('La categoría no puede superar los 32 caracteres')
  })

  it('rechaza un mes inválido', async () => {
    const token = await registerAndLogin()

    for (const month of ['08-2026', '2026-8', '2026-13', '2026-00', 'agosto']) {
      const { status, body } = await createBudget(token, { month })

      expect(status).toBe(400)
      expect(body.error).toBe('El mes debe tener formato AAAA-MM')
    }
  })

  it('rechaza montos no enteros positivos', async () => {
    const token = await registerAndLogin()

    for (const amount of [0, -5, 100.5, 'abc']) {
      const { status, body } = await createBudget(token, { amount })

      expect(status).toBe(400)
      expect(body.error).toBe('El monto debe ser un número entero positivo (en centavos)')
    }
  })

  it('rechaza un presupuesto duplicado sin distinguir mayúsculas', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { category: 'Comida' })

    const { status, body } = await createBudget(token, { category: 'comida' })

    expect(status).toBe(409)
    expect(body.error).toBe('Ya existe un presupuesto para esa categoría y mes')
  })

  it('asigna el umbral por defecto de 80 cuando no se envía', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createBudget(token)

    expect(status).toBe(201)
    expect(body.threshold).toBe(80)
  })

  it('crea con un umbral personalizado válido', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createBudget(token, { threshold: 50 })

    expect(status).toBe(201)
    expect(body.threshold).toBe(50)
  })

  it('rechaza umbrales fuera del rango 1 a 100', async () => {
    const token = await registerAndLogin()

    for (const threshold of [0, 101, -5, 50.5, 'abc']) {
      const { status, body } = await createBudget(token, { threshold })

      expect(status).toBe(400)
      expect(body.error).toBe('El umbral debe ser un número entero entre 1 y 100')
    }
  })
})

describe('listado de presupuestos', () => {
  it('no expone los presupuestos de otro usuario', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    await createBudget(tokenA)

    const { status, body } = await request('/api/budgets', { token: tokenB })

    expect(status).toBe(200)
    expect(body).toEqual([])
  })

  it('filtra por mes y por categoría', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { category: 'Comida', month: '2026-08' })
    await createBudget(token, { category: 'Transporte', month: '2026-08' })
    await createBudget(token, { category: 'Vivienda', month: '2026-07' })

    const byMonth = await request('/api/budgets?month=2026-08', { token })
    const byCategory = await request('/api/budgets?category=transporte', { token })

    expect(byMonth.body).toHaveLength(2)
    expect(byCategory.body).toHaveLength(1)
    expect(byCategory.body[0].category).toBe('Transporte')
  })

  it('rechaza un mes inválido en el filtro', async () => {
    const token = await registerAndLogin()
    const { status, body } = await request('/api/budgets?month=08-2026', { token })

    expect(status).toBe(400)
    expect(body.error).toBe('El mes debe tener formato AAAA-MM')
  })

  it('incluye el total gastado solo del mismo mes y categoría', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { category: 'Comida', month: '2026-08', amount: 100000 })
    await createExpense(token, 'Comida', 3000, '2026-08-15')
    await createExpense(token, 'comida', 2000, '2026-08-20')
    await createExpense(token, 'Comida', 5000, '2026-07-20')
    await createExpense(token, 'Transporte', 4000, '2026-08-10')
    await request('/api/transactions', {
      method: 'POST',
      body: { type: 'income', amount: 9000, date: '2026-08-01', category: 'Comida' },
      token
    })

    const { body } = await request('/api/budgets', { token })

    expect(body).toHaveLength(1)
    expect(body[0].spent).toBe(5000)
  })

  it('incluye el umbral configurado en el listado', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { threshold: 60 })

    const { body } = await request('/api/budgets', { token })

    expect(body[0].threshold).toBe(60)
  })

  it('el gastado no cruza datos entre usuarios', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    await createBudget(tokenA, { category: 'Comida', month: '2026-08' })
    await createExpense(tokenB, 'Comida', 9999, '2026-08-10')

    const { body } = await request('/api/budgets', { token: tokenA })

    expect(body[0].spent).toBe(0)
  })
})

describe('consulta de un presupuesto', () => {
  it('devuelve un presupuesto propio con su gastado', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createBudget(token)
    await createExpense(token, 'Comida', 2500, '2026-08-03')

    const { status, body } = await request(`/api/budgets/${created.id}`, { token })

    expect(status).toBe(200)
    expect(body).toMatchObject({ id: created.id, amount: 100000, spent: 2500 })
  })

  it('responde 404 ante un presupuesto ajeno o inexistente', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    const { body: created } = await createBudget(tokenA)

    for (const id of [created.id, 99999]) {
      const { status, body } = await request(`/api/budgets/${id}`, { token: tokenB })

      expect(status).toBe(404)
      expect(body.error).toBe('Presupuesto no encontrado')
    }
  })
})

describe('actualización de presupuestos', () => {
  it('modifica un presupuesto propio', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createBudget(token)

    const { status, body } = await request(`/api/budgets/${created.id}`, {
      method: 'PUT',
      body: { category: 'Comida', month: '2026-08', amount: 150000 },
      token
    })

    expect(status).toBe(200)
    expect(body).toMatchObject({ id: created.id, amount: 150000 })
  })

  it('conserva el umbral existente al editar sin enviarlo', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createBudget(token, { threshold: 90 })

    const { status, body } = await request(`/api/budgets/${created.id}`, {
      method: 'PUT',
      body: { category: 'Comida', month: '2026-08', amount: 150000 },
      token
    })

    expect(status).toBe(200)
    expect(body.threshold).toBe(90)
  })

  it('actualiza el umbral cuando se envía uno válido', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createBudget(token)

    const { status, body } = await request(`/api/budgets/${created.id}`, {
      method: 'PUT',
      body: { category: 'Comida', month: '2026-08', amount: 100000, threshold: 40 },
      token
    })

    expect(status).toBe(200)
    expect(body.threshold).toBe(40)
  })

  it('rechaza un umbral inválido en la edición', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createBudget(token)

    const { status } = await request(`/api/budgets/${created.id}`, {
      method: 'PUT',
      body: { category: 'Comida', month: '2026-08', amount: 100000, threshold: 150 },
      token
    })

    expect(status).toBe(400)
  })

  it('responde 409 al editar generando un duplicado', async () => {
    const token = await registerAndLogin()
    await createBudget(token, { category: 'Comida', month: '2026-08' })
    const { body: otro } = await createBudget(token, { category: 'Transporte', month: '2026-08' })

    const { status, body } = await request(`/api/budgets/${otro.id}`, {
      method: 'PUT',
      body: { category: 'comida', month: '2026-08', amount: 50000 },
      token
    })

    expect(status).toBe(409)
    expect(body.error).toBe('Ya existe un presupuesto para esa categoría y mes')
  })

  it('responde 404 al modificar un presupuesto ajeno', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    const { body: created } = await createBudget(tokenA)

    const { status, body } = await request(`/api/budgets/${created.id}`, {
      method: 'PUT',
      body: validBudget({ amount: 1 }),
      token: tokenB
    })

    expect(status).toBe(404)
    expect(body.error).toBe('Presupuesto no encontrado')
  })
})

describe('eliminación de presupuestos', () => {
  it('elimina un presupuesto propio', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createBudget(token)

    const { status } = await request(`/api/budgets/${created.id}`, { method: 'DELETE', token })
    const { body: after } = await request('/api/budgets', { token })

    expect(status).toBe(204)
    expect(after).toEqual([])
  })

  it('responde 404 al eliminar un presupuesto ajeno o inexistente', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    const { body: created } = await createBudget(tokenA)

    const responses = await Promise.all([
      request(`/api/budgets/${created.id}`, { method: 'DELETE', token: tokenB }),
      request('/api/budgets/99999', { method: 'DELETE', token: tokenB })
    ])

    for (const response of responses) {
      expect(response.status).toBe(404)
    }
  })
})

describe('autenticación de presupuestos', () => {
  it('responde 401 sin token en todas las operaciones', async () => {
    const operations = [
      request('/api/budgets', { method: 'POST', body: validBudget() }),
      request('/api/budgets'),
      request('/api/budgets/1'),
      request('/api/budgets/1', { method: 'PUT', body: validBudget() }),
      request('/api/budgets/1', { method: 'DELETE' })
    ]

    const responses = await Promise.all(operations)

    for (const response of responses) {
      expect(response.status).toBe(401)
    }
  })

  it('responde 401 con un token inválido', async () => {
    const { status } = await request('/api/budgets', { token: 'token-invalido' })

    expect(status).toBe(401)
  })
})