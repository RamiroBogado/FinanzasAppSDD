import jwt from 'jsonwebtoken'
import { jwtSecret } from '../config.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    const payload = jwt.verify(header.slice(7), jwtSecret)
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}