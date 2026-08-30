import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import jwt from 'jsonwebtoken'
import app from '../src/app.js'
import { jwtSecret } from '../src/config.js'
import { getDatabase } from '../src/db.js'

let server
let baseUrl

beforeEach(async () => {
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

  return { status: response.status, body: await response.json() }
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

async function registerUser({ username = 'rama', email = 'rama@example.com', password = 'secret123' } = {}) {
  return request('/api/auth/register', { method: 'POST', body: { username, email, password } })
}

describe('registro', () => {
  it('crea la cuenta con hash y responde 201 sin token', async () => {
    const { status, body } = await registerUser()

    expect(status).toBe(201)
    expect(getData(body)).toMatchObject({ username: 'rama', email: 'rama@example.com' })
    expect(body).not.toHaveProperty('token')

    const stored = getDatabase().prepare('SELECT * FROM users WHERE username = ?').get('rama')
    expect(stored.password_hash).not.toBe('secret123')
    expect(stored.password_hash).toMatch(/^\$2/)
  })

  it('rechaza un username duplicado con distinto case', async () => {
    await registerUser()
    const { status, body } = await registerUser({ username: 'Rama', email: 'otro@example.com' })

    expect(status).toBe(409)
    expect(body.error).toBe('El nombre de usuario ya está en uso')
  })

  it('rechaza un email duplicado', async () => {
    await registerUser()
    const { status, body } = await registerUser({ username: 'otro', email: 'RAMA@example.com' })

    expect(status).toBe(409)
    expect(body.error).toBe('El correo electrónico ya está en uso')
  })

  it('rechaza un username inválido', async () => {
    const { status, body } = await registerUser({ username: 'rama usuario', email: 'otro@example.com' })

    expect(status).toBe(400)
    expect(body.error).toContain('El nombre de usuario')
  })

  it('no almacena la contraseña en texto plano', async () => {
    await registerUser()

    const stored = getDatabase().prepare('SELECT password_hash FROM users WHERE username = ?').get('rama')
    expect(stored.password_hash).not.toBe('secret123')
    expect(stored.password_hash).not.toContain('secret123')
  })
})

describe('login', () => {
  it('inicia sesión y devuelve un token de 24 horas', async () => {
    await registerUser()
    const { status, body } = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'rama', password: 'secret123' }
    })

    const stored = getDatabase().prepare('SELECT id FROM users WHERE username = ?').get('rama')

    expect(status).toBe(200)
    expect(typeof body.token).toBe('string')

    const payload = jwt.verify(body.token, jwtSecret)
    expect(payload.sub).toBe(stored.id)
    expect(payload.exp - payload.iat).toBe(24 * 60 * 60)
  })

  it('acepta el username en otro formato de mayúsculas', async () => {
    await registerUser()
    const { status } = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'RAMA', password: 'secret123' }
    })

    expect(status).toBe(200)
  })

  it('rechaza un usuario inexistente con error genérico', async () => {
    const { status, body } = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'nadie', password: 'secret123' }
    })

    expect(status).toBe(401)
    expect(body.error).toBe('Usuario o contraseña incorrectos')
  })

  it('rechaza una contraseña incorrecta con el mismo error genérico', async () => {
    await registerUser()
    const { status, body } = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'rama', password: 'contraseña-mal' }
    })

    expect(status).toBe(401)
    expect(body.error).toBe('Usuario o contraseña incorrectos')
  })

  it('no acepta el email como identificador de login', async () => {
    await registerUser()
    const { status } = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'rama@example.com', password: 'secret123' }
    })

    expect(status).toBe(401)
  })
})

describe('me', () => {
  it('devuelve el usuario autenticado', async () => {
    await registerUser()
    const { body: loginBody } = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'rama', password: 'secret123' }
    })
    const { status, body } = await request('/api/auth/me', { token: loginBody.token })

    expect(status).toBe(200)
    expect(getData(body)).toMatchObject({ username: 'rama', email: 'rama@example.com' })
  })

  it('rechaza la solicitud sin token', async () => {
    const { status, body } = await request('/api/auth/me')

    expect(status).toBe(401)
    expect(body.error).toBe('No autorizado')
  })

  it('rechaza un token inválido', async () => {
    const { status, body } = await request('/api/auth/me', { token: 'token-invalido' })

    expect(status).toBe(401)
    expect(body.error).toBe('Token inválido o expirado')
  })

  it('rechaza un token expirado', async () => {
    const expiredToken = jwt.sign({ sub: 1 }, jwtSecret, { expiresIn: '-1s' })
    const { status, body } = await request('/api/auth/me', { token: expiredToken })

    expect(status).toBe(401)
    expect(body.error).toBe('Token inválido o expirado')
  })
})

describe('recuperación de contraseña', () => {
  it('responde el mensaje genérico con un email registrado', async () => {
    await registerUser()
    const { status, body } = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'rama@example.com' }
    })

    expect(status).toBe(200)
    expect(body.message).toBe(
      'Si el correo electrónico está registrado, recibirás instrucciones para recuperar tu contraseña'
    )
  })

  it('responde el mismo mensaje genérico con un email no registrado', async () => {
    const { status, body } = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'desconocido@example.com' }
    })

    expect(status).toBe(200)
    expect(body.message).toBe(
      'Si el correo electrónico está registrado, recibirás instrucciones para recuperar tu contraseña'
    )
  })

  it('rechaza un email con formato inválido', async () => {
    const { status } = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'no-es-un-email' }
    })

    expect(status).toBe(400)
  })
})