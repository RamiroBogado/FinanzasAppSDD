import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import alertsRouter from './routes/alerts.js'
import authRouter from './routes/auth.js'
import budgetsRouter from './routes/budgets.js'
import categoriesRouter from './routes/categories.js'
import chatRouter from './routes/chat.js'
import goalsRouter from './routes/goals.js'
import transactionsRouter from './routes/transactions.js'

const app = express()

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http://localhost:3001", "http://localhost:3002"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
}))

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Origen no autorizado'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())

const isTest = process.env.NODE_ENV === 'test'

// Rate limiters (skip in test mode)
let authRateLimit = (req, res, next) => next()
let forgotRateLimit = (req, res, next) => next()
let chatRateLimit = (req, res, next) => next()
let apiRateLimit = (req, res, next) => next()

if (!isTest) {
  const rateLimit = (await import('express-rate-limit')).default
  
  authRateLimit = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
    message: { error: 'Demasiadas peticiones, intentá más tarde' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
  })

  forgotRateLimit = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 60000,
    max: 5,
    message: { error: 'Demasiadas peticiones, intentá más tarde' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
  })

  chatRateLimit = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_CHAT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_CHAT_MAX) || 20,
    message: { error: 'Demasiadas consultas al asistente, intentá más tarde' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.userId || req.ip,
  })

  apiRateLimit = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_API_MAX) || 100,
    message: { error: 'Límite de peticiones excedido, intentá más tarde' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.userId || req.ip,
  })
}

// Health check (sin rate limit)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Auth routes with specific rate limits
app.use('/api/auth/register', authRateLimit)
app.use('/api/auth/login', authRateLimit)
app.use('/api/auth/forgot-password', forgotRateLimit)
app.use('/api/auth/reset-password', forgotRateLimit)

// Auth router (includes register, login, me, forgot-password, reset-password)
app.use('/api/auth', authRouter)

// Chat with specific rate limit
app.use('/api/chat/messages', chatRateLimit)
app.use('/api/chat', chatRouter)

// Global API rate limit for authenticated routes (applied after requireAuth in routes)
app.use('/api', (req, res, next) => {
  // Skip rate limit for health and auth routes (already handled)
  if (req.path === '/health' || req.path.startsWith('/auth')) return next()
  apiRateLimit(req, res, next)
})

// Other routes
app.use('/api/transactions', transactionsRouter)
app.use('/api/budgets', budgetsRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/categories', categoriesRouter)

// Global error handler
app.use((err, req, res) => {
  console.error('Unhandled error:', err)
  const status = err.status || 500
  const message = err.message || 'Error interno del servidor'
  res.status(status).json({ error: message })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado' })
})

export default app