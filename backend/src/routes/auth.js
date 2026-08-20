import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { jwtExpiresIn, jwtSecret } from '../config.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  toPublicUser
} from '../users.js'

const router = Router()

const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body ?? {}

  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username)) {
    return res.status(400).json({
      error: 'El nombre de usuario solo puede contener letras, números y guion bajo, sin espacios'
    })
  }

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'El correo electrónico no es válido' })
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
  }

  const normalizedEmail = email.toLowerCase()

  if (findUserByUsername(username)) {
    return res.status(409).json({ error: 'El nombre de usuario ya está en uso' })
  }

  if (findUserByEmail(normalizedEmail)) {
    return res.status(409).json({ error: 'El correo electrónico ya está en uso' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = createUser({ username, email: normalizedEmail, passwordHash })

  res.status(201).json(toPublicUser(user))
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  const user = typeof username === 'string' ? findUserByUsername(username) : undefined

  if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  }

  const token = jwt.sign({ sub: user.id, username: user.username }, jwtSecret, {
    expiresIn: jwtExpiresIn
  })

  res.json({ token })
})

router.get('/me', requireAuth, (req, res) => {
  const user = findUserById(req.userId)

  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  res.json(toPublicUser(user))
})

router.post('/forgot-password', (req, res) => {
  const { email } = req.body ?? {}

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'El correo electrónico no es válido' })
  }

  res.json({
    message: 'Si el correo electrónico está registrado, recibirás instrucciones para recuperar tu contraseña'
  })
})

export default router