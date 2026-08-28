import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app.js'
import { getDatabase } from '../src/db.js'

let server
let baseUrl

beforeEach(async () => {
  getDatabase().prepare('DELETE FROM categories').run()
  getDatabase().prepare('DELETE FROM transactions').run()
  getDatabase().prepare('DELETE FROM budgets').run()
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

async function createCategory(token, overrides) {
  return request('/api/categories', {
    method: 'POST',
    body: { name: 'Comida', type: 'expense', color: '#ef4444', ...overrides },
    token
  })
}

describe('creación de categorías', () => {
  it('crea una categoría de gasto válida y responde 201', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createCategory(token)

    expect(status).toBe(201)
    expect(body).toMatchObject({ name: 'Comida', type: 'expense', color: '#ef4444' })
    expect(typeof body.id).toBe('number')
  })

  it('crea una categoría de ingreso válida y responde 201', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createCategory(token, { name: 'Sueldo', type: 'income', color: '#10b981' })

    expect(status).toBe(201)
    expect(body).toMatchObject({ name: 'Sueldo', type: 'income', color: '#10b981' })
  })

  it('rechaza un nombre duplicado sin distinguir mayúsculas', async () => {
    const token = await registerAndLogin()
    await createCategory(token)

    const { status, body } = await createCategory(token, { name: 'comida' })

    expect(status).toBe(400)
    expect(body.error).toBe('Ya existe una categoría con ese nombre')
  })

  it('rechaza un color fuera de la paleta', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createCategory(token, { color: '#ff0000' })

    expect(status).toBe(400)
    expect(body.error).toBe('Color no válido')
  })

  it('rechaza un tipo inválido', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createCategory(token, { type: 'otro' })

    expect(status).toBe(400)
    expect(body.error).toBe('El tipo debe ser income o expense')
  })

  it('rechaza un nombre vacío o demasiado largo', async () => {
    const token = await registerAndLogin()

    for (const name of ['', '   ', 'a'.repeat(33)]) {
      const { status } = await createCategory(token, { name })

      expect(status).toBe(400)
    }
  })

  it('rechaza un color ausente', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createCategory(token, { color: undefined })

    expect(status).toBe(400)
    expect(body.error).toBe('Color no válido')
  })
})

describe('listado de categorías', () => {
  it('devuelve una lista vacía cuando no hay categorías', async () => {
    const token = await registerAndLogin()
    const { status, body } = await request('/api/categories', { token })

    expect(status).toBe(200)
    expect(body).toEqual([])
  })

  it('devuelve las categorías ordenadas por nombre', async () => {
    const token = await registerAndLogin()
    await createCategory(token, { name: 'Sueldo', type: 'income', color: '#10b981' })
    await createCategory(token, { name: 'Comida' })
    await createCategory(token, { name: 'Transporte' })

    const { status, body } = await request('/api/categories', { token })

    expect(status).toBe(200)
    expect(body).toHaveLength(3)
    expect(body.map((category) => category.name)).toEqual(['Comida', 'Sueldo', 'Transporte'])
  })

  it('no expone las categorías de otro usuario', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    await createCategory(tokenA)

    const { status, body } = await request('/api/categories', { token: tokenB })

    expect(status).toBe(200)
    expect(body).toEqual([])
  })
})

describe('actualización de categorías', () => {
  it('renombra una categoría propia', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createCategory(token)

    const { status, body } = await request(`/api/categories/${created.id}`, {
      method: 'PUT',
      body: { name: 'Alimentación' },
      token
    })

    expect(status).toBe(200)
    expect(body).toMatchObject({ id: created.id, name: 'Alimentación', type: 'expense', color: '#ef4444' })
  })

  it('rechaza renombrar a un nombre existente', async () => {
    const token = await registerAndLogin()
    await createCategory(token)
    const { body: otro } = await createCategory(token, { name: 'Transporte' })

    const { status, body } = await request(`/api/categories/${otro.id}`, {
      method: 'PUT',
      body: { name: 'Comida' },
      token
    })

    expect(status).toBe(400)
    expect(body.error).toBe('Ya existe una categoría con ese nombre')
  })

  it('responde 404 al actualizar una categoría ajena o inexistente', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    const { body: created } = await createCategory(tokenA)

    const responses = await Promise.all([
      request(`/api/categories/${created.id}`, { method: 'PUT', body: { name: 'X' }, token: tokenB }),
      request('/api/categories/99999', { method: 'PUT', body: { name: 'X' }, token: tokenB })
    ])

    for (const response of responses) {
      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Categoría no encontrada')
    }
  })
})

describe('eliminación de categorías', () => {
  it('elimina una categoría no usada', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createCategory(token)

    const { status } = await request(`/api/categories/${created.id}`, { method: 'DELETE', token })
    const { body: after } = await request('/api/categories', { token })

    expect(status).toBe(204)
    expect(after).toEqual([])
  })

  it('responde 409 al eliminar una categoría usada en transacciones', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createCategory(token)
    await request('/api/transactions', {
      method: 'POST',
      body: { type: 'expense', amount: 5000, date: '2026-08-10', category: 'Comida' },
      token
    })

    const { status, body } = await request(`/api/categories/${created.id}`, { method: 'DELETE', token })

    expect(status).toBe(409)
    expect(body.error).toBe('No se puede eliminar: la categoría está en uso')
  })

  it('responde 409 al eliminar una categoría usada en presupuestos', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createCategory(token)
    await request('/api/budgets', {
      method: 'POST',
      body: { category: 'Comida', month: '2026-08', amount: 50000 },
      token
    })

    const { status, body } = await request(`/api/categories/${created.id}`, { method: 'DELETE', token })

    expect(status).toBe(409)
    expect(body.error).toBe('No se puede eliminar: la categoría está en uso')
  })

  it('responde 404 al eliminar una categoría ajena o inexistente', async () => {
    const tokenA = await registerAndLogin({ username: 'rama', email: 'rama@example.com' })
    const tokenB = await registerAndLogin({ username: 'otro', email: 'otro@example.com' })
    const { body: created } = await createCategory(tokenA)

    const responses = await Promise.all([
      request(`/api/categories/${created.id}`, { method: 'DELETE', token: tokenB }),
      request('/api/categories/99999', { method: 'DELETE', token: tokenB })
    ])

    for (const response of responses) {
      expect(response.status).toBe(404)
    }
  })
})

describe('autenticación de categorías', () => {
  it('responde 401 sin token en todas las operaciones', async () => {
    const operations = [
      request('/api/categories', { method: 'POST', body: { name: 'Comida', type: 'expense', color: '#ef4444' } }),
      request('/api/categories'),
      request('/api/categories/1'),
      request('/api/categories/1', { method: 'PUT', body: { name: 'X' } }),
      request('/api/categories/1', { method: 'DELETE' })
    ]

    const responses = await Promise.all(operations)

    for (const response of responses) {
      expect(response.status).toBe(401)
    }
  })

  it('responde 401 con un token inválido', async () => {
    const { status } = await request('/api/categories', { token: 'token-invalido' })

    expect(status).toBe(401)
  })
})
