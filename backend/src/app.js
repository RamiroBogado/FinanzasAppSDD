import express from 'express'
import alertsRouter from './routes/alerts.js'
import authRouter from './routes/auth.js'
import budgetsRouter from './routes/budgets.js'
import categoriesRouter from './routes/categories.js'
import chatRouter from './routes/chat.js'
import goalsRouter from './routes/goals.js'
import transactionsRouter from './routes/transactions.js'

const app = express()

app.use(express.json())

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/budgets', budgetsRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/chat', chatRouter)
app.use('/api/categories', categoriesRouter)

export default app