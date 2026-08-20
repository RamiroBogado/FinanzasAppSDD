import express from 'express'
import authRouter from './routes/auth.js'
import budgetsRouter from './routes/budgets.js'
import transactionsRouter from './routes/transactions.js'

const app = express()

app.use(express.json())

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/budgets', budgetsRouter)

export default app