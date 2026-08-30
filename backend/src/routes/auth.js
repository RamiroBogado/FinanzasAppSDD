import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { jwtExpiresIn, jwtSecret } from '../config.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { getDatabase } from '../db.js'
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

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body ?? {}

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'El correo electrónico no es válido' })
  }

  const normalizedEmail = email.toLowerCase()
  const user = findUserByEmail(normalizedEmail)

  // Siempre responder 200 genérico para no revelar si el email existe
  const genericResponse = {
    message: 'Si el correo electrónico está registrado, recibirás instrucciones para recuperar tu contraseña'
  }

  if (!user) {
    return res.json(genericResponse)
  }

  const jti = randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hora
  const createdAt = new Date().toISOString()

  const resetToken = jwt.sign(
    { sub: user.id, type: 'password_reset', jti },
    jwtSecret,
    { expiresIn: '1h' }
  )

  try {
    getDatabase().prepare(`
      INSERT INTO password_reset_tokens (user_id, jti, used, expires_at, created_at)
      VALUES (?, ?, 0, ?, ?)
    `).run(user.id, jti, expiresAt, createdAt)
  } catch (err) {
    console.error('Error guardando token de reset:', err)
  }

  // Enviar email o loguear en desarrollo
  const smtpHost = process.env.SMTP_HOST
  if (smtpHost) {
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'FinanzasApp <noreply@finanzasapp.com>',
        to: normalizedEmail,
        subject: 'Recuperación de contraseña - FinanzasApp',
        html: `
          <p>Hola ${user.username},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p><a href="${resetUrl}">Hacé clic aquí para restablecer tu contraseña</a></p>
          <p>Este enlace expira en 1 hora.</p>
          <p>Si no solicitaste esto, ignorá este email.</p>
        `,
      })
    } catch (err) {
      console.error('Error enviando email de reset:', err)
    }
  } else {
    // Desarrollo: loguear token en consola
    console.log('[DEV RESET TOKEN]', { email: normalizedEmail, token: resetToken })
  }

  res.json(genericResponse)
})

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body ?? {}

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token requerido' })
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
  }

  let payload
  try {
    payload = jwt.verify(token, jwtSecret)
  } catch {
    return res.status(400).json({ error: 'Token inválido o expirado' })
  }

  if (payload.type !== 'password_reset') {
    return res.status(400).json({ error: 'Token inválido' })
  }

  const db = getDatabase()
  const tokenRecord = db.prepare(`
    SELECT * FROM password_reset_tokens WHERE jti = ? AND used = 0
  `).get(payload.jti)

  if (!tokenRecord) {
    return res.status(400).json({ error: 'Token inválido o ya utilizado' })
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return res.status(400).json({ error: 'El token ha expirado, solicitá uno nuevo' })
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, payload.sub)

  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE jti = ?').run(payload.jti)

  res.json({ message: 'Contraseña actualizada' })
})

router.get('/me', requireAuth, (req, res) => {
  const user = findUserById(req.userId)

  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  res.json(toPublicUser(user))
})

export default router