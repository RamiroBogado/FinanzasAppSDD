import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app.js'
import { getDatabase } from '../src/db.js'

let server
let baseUrl

beforeEach(async () => {
  getDatabase().prepare('DELETE FROM goals').run()
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

function validGoal(overrides = {}) {
  return {
    name: 'Vacaciones',
    targetAmount: 500000,
    ...overrides
  }
}

async function createGoal(token, overrides) {
  return request('/api/goals', { method: 'POST', body: validGoal(overrides), token })
}

describe('creación de metas de ahorro', () => {
  it('crea una meta válida y responde 201 con sus datos', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createGoal(token)

    expect(status).toBe(201)
    expect(body).toMatchObject({ name: 'Vacaciones', targetAmount: 500000 })
    expect(body.savedAmount).toBe(0)
    expect(body.deadline).toBeNull()
    expect(typeof body.id).toBe('number')
  })

  it('crea una meta con ahorrado inicial y fecha límite', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createGoal(token, {
      savedAmount: 150000,
      deadline: '2026-12-31'
    })

    expect(status).toBe(201)
    expect(body.savedAmount).toBe(150000)
    expect(body.deadline).toBe('2026-12-31')
  })

  it('recorta espacios del nombre', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createGoal(token, { name: '  Vacaciones  ' })

    expect(status).toBe(201)
    expect(body.name).toBe('Vacaciones')
  })

  it('rechaza un nombre vacío o ausente', async () => {
    const token = await registerAndLogin()

    for (const name of [undefined, null, '', '   ']) {
      const { status, body } = await createGoal(token, { name })

      expect(status).toBe(400)
      expect(body.error).toBe('El nombre es obligatorio')
    }
  })

  it('rechaza un nombre de más de 80 caracteres', async () => {
    const token = await registerAndLogin()
    const { status, body } = await createGoal(token, { name: 'a'.repeat(81) })

    expect(status).toBe(400)
    expect(body.error).toBe('El nombre no puede superar los 80 caracteres')
  })

  it('rechaza montos objetivo no enteros positivos', async () => {
    const token = await registerAndLogin()

    for (const targetAmount of [0, -5, 100.5, 'abc']) {
      const { status, body } = await createGoal(token, { targetAmount })

      expect(status).toBe(400)
      expect(body.error).toBe(
        'El monto objetivo debe ser un número entero positivo (en centavos)'
      )
    }
  })

  it('rechaza montos ahorrados negativos o no enteros', async () => {
    const token = await registerAndLogin()

    for (const savedAmount of [-1, 50.5, 'abc']) {
      const { status, body } = await createGoal(token, { savedAmount })

      expect(status).toBe(400)
      expect(body.error).toBe(
        'El monto ahorrado debe ser un número entero no negativo (en centavos)'
      )
    }
  })

  it('rechaza fechas límite inválidas', async () => {
    const token = await registerAndLogin()

    for (const deadline of ['31-12-2026', '2026/12/31', '2026-13-01', 'vacaciones']) {
      const { status, body } = await createGoal(token, { deadline })

      expect(status).toBe(400)
      expect(body.error).toBe('La fecha límite debe tener formato AAAA-MM-DD')
    }
  })
})

describe('listado de metas de ahorro', () => {
  it('lista las metas ordenadas por creación descendente', async () => {
    const token = await registerAndLogin()
    await createGoal(token, { name: 'Primera' })
    await createGoal(token, { name: 'Segunda' })

    const { status, body } = await request('/api/goals', { token })

    expect(status).toBe(200)
    expect(body.map((goal) => goal.name)).toEqual(['Segunda', 'Primera'])
  })

  it('nunca incluye metas de otros usuarios', async () => {
    const tokenA = await registerAndLogin({ username: 'user_a', email: 'a@example.com' })
    await createGoal(tokenA)
    const tokenB = await registerAndLogin({ username: 'user_b', email: 'b@example.com' })

    const { status, body } = await request('/api/goals', { token: tokenB })

    expect(status).toBe(200)
    expect(body).toEqual([])
  })
})

describe('consulta de una meta de ahorro', () => {
  it('devuelve la meta propia por id', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createGoal(token)

    const { status, body } = await request(`/api/goals/${created.id}`, { token })

    expect(status).toBe(200)
    expect(body.name).toBe('Vacaciones')
  })

  it('responde 404 para una meta ajena o inexistente', async () => {
    const tokenA = await registerAndLogin({ username: 'user_a', email: 'a@example.com' })
    const tokenB = await registerAndLogin({ username: 'user_b', email: 'b@example.com' })
    const { body: created } = await createGoal(tokenA)

    const foreign = await request(`/api/goals/${created.id}`, { token: tokenB })
    const missing = await request('/api/goals/999999', { token: tokenA })

    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(foreign.body.error).toBe('Meta de ahorro no encontrada')
  })
})

describe('actualización de metas de ahorro', () => {
  it('actualiza los campos de la meta propia', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createGoal(token)

    const { status, body } = await request(`/api/goals/${created.id}`, {
      method: 'PUT',
      body: validGoal({
        name: 'Nueva moto',
        targetAmount: 800000,
        savedAmount: 100000,
        deadline: '2027-06-30'
      }),
      token
    })

    expect(status).toBe(200)
    expect(body).toMatchObject({
      name: 'Nueva moto',
      targetAmount: 800000,
      savedAmount: 100000,
      deadline: '2027-06-30'
    })
  })

  it('responde 404 al actualizar una meta ajena', async () => {
    const tokenA = await registerAndLogin({ username: 'user_a', email: 'a@example.com' })
    const tokenB = await registerAndLogin({ username: 'user_b', email: 'b@example.com' })
    const { body: created } = await createGoal(tokenA)

    const { status } = await request(`/api/goals/${created.id}`, {
      method: 'PUT',
      body: validGoal(),
      token: tokenB
    })

    expect(status).toBe(404)
  })

  it('valida el payload al actualizar', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createGoal(token)

    const { status, body } = await request(`/api/goals/${created.id}`, {
      method: 'PUT',
      body: validGoal({ savedAmount: -10 }),
      token
    })

    expect(status).toBe(400)
    expect(body.error).toBe('El monto ahorrado debe ser un número entero no negativo (en centavos)')
  })
})

describe('eliminación de metas de ahorro', () => {
  it('elimina la meta propia con 204 y desaparece del listado', async () => {
    const token = await registerAndLogin()
    const { body: created } = await createGoal(token)

    const deleted = await request(`/api/goals/${created.id}`, { method: 'DELETE', token })
    const listed = await request('/api/goals', { token })

    expect(deleted.status).toBe(204)
    expect(listed.body).toEqual([])
  })

  it('responde 404 al eliminar una meta ajena', async () => {
    const tokenA = await registerAndLogin({ username: 'user_a', email: 'a@example.com' })
    const tokenB = await registerAndLogin({ username: 'user_b', email: 'b@example.com' })
    const { body: created } = await createGoal(tokenA)

    const { status } = await request(`/api/goals/${created.id}`, {
      method: 'DELETE',
      token: tokenB
    })

    expect(status).toBe(404)
  })
})

describe('protección de metas de ahorro', () => {
  it('exige token en todas las operaciones', async () => {
    const withoutTokenPost = await request('/api/goals', { method: 'POST', body: validGoal() })
    const withoutTokenGet = await request('/api/goals')

    expect(withoutTokenPost.status).toBe(401)
    expect(withoutTokenGet.status).toBe(401)
    expect(withoutTokenGet.body.error).toBe('No autorizado')
  })
})
