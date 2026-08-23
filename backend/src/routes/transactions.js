import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { toCsv, toPdf, toXlsx } from '../exporters.js'
import {
  createTransaction,
  deleteTransaction,
  findTransactionById,
  listTransactions,
  toPublicTransaction,
  updateTransaction
} from '../transactions.js'

const router = Router()

const TRANSACTION_TYPES = ['income', 'expense']
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_DESCRIPTION_LENGTH = 255
const MAX_CATEGORY_LENGTH = 32

const EXPORT_FORMATS = {
  csv: {
    contentType: 'text/csv; charset=utf-8',
    extension: 'csv'
  },
  pdf: {
    contentType: 'application/pdf',
    extension: 'pdf'
  },
  xlsx: {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx'
  }
}

function toToday() {
  return new Date().toISOString().slice(0, 10)
}

function validatePayload(body) {
  const { type, amount, date, description, category } = body ?? {}

  if (typeof type !== 'string' || !TRANSACTION_TYPES.includes(type)) {
    return { error: 'El tipo de transacción debe ser income o expense' }
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: 'El monto debe ser un número entero positivo (en centavos)' }
  }

  if (date !== undefined && (typeof date !== 'string' || !DATE_PATTERN.test(date))) {
    return { error: 'La fecha debe tener formato AAAA-MM-DD' }
  }

  if (
    description !== undefined &&
    description !== null &&
    (typeof description !== 'string' || description.length > MAX_DESCRIPTION_LENGTH)
  ) {
    return { error: 'La descripción no puede superar los 255 caracteres' }
  }

  if (
    category !== undefined &&
    category !== null &&
    (typeof category !== 'string' || category.length > MAX_CATEGORY_LENGTH)
  ) {
    return { error: 'La categoría no puede superar los 32 caracteres' }
  }

  return {
    value: {
      type,
      amount,
      date: date ?? toToday(),
      description: description === undefined ? null : description,
      category: typeof category === 'string' ? category.trim() || null : null
    }
  }
}

function validateListQuery(query) {
  const { type, category, q, from, to } = query

  if (type && !TRANSACTION_TYPES.includes(type)) {
    return { error: 'El tipo de transacción debe ser income o expense' }
  }

  if (from !== undefined && (typeof from !== 'string' || !DATE_PATTERN.test(from))) {
    return { error: 'La fecha debe tener formato AAAA-MM-DD' }
  }

  if (to !== undefined && (typeof to !== 'string' || !DATE_PATTERN.test(to))) {
    return { error: 'La fecha debe tener formato AAAA-MM-DD' }
  }

  return {
    value: {
      type: typeof type === 'string' ? type : undefined,
      category: typeof category === 'string' ? category : undefined,
      q: typeof q === 'string' ? q : undefined,
      from: typeof from === 'string' ? from : undefined,
      to: typeof to === 'string' ? to : undefined
    }
  }
}

router.use(requireAuth)

router.post('/', (req, res) => {
  const result = validatePayload(req.body)

  if (result.error) {
    return res.status(400).json({ error: result.error })
  }

  const transaction = createTransaction({ userId: req.userId, ...result.value })

  res.status(201).json(toPublicTransaction(transaction))
})

router.get('/', (req, res) => {
  const result = validateListQuery(req.query)

  if (result.error) {
    return res.status(400).json({ error: result.error })
  }

  const transactions = listTransactions(req.userId, result.value)

  res.json(transactions.map(toPublicTransaction))
})

router.get('/export', async (req, res) => {
  const exportFormat = EXPORT_FORMATS[req.query.format]

  if (!exportFormat) {
    return res.status(400).json({ error: 'El formato de exportación debe ser csv, pdf o xlsx' })
  }

  const result = validateListQuery(req.query)

  if (result.error) {
    return res.status(400).json({ error: result.error })
  }

  const transactions = listTransactions(req.userId, result.value)
  const filename = `transacciones-${toToday()}.${exportFormat.extension}`

  res.setHeader('Content-Type', exportFormat.contentType)
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  if (req.query.format === 'csv') {
    return res.send(toCsv(transactions))
  }

  const buffer = req.query.format === 'pdf' ? await toPdf(transactions) : await toXlsx(transactions)

  res.send(buffer)
})

router.get('/:id', (req, res) => {
  const transaction = findTransactionById(req.params.id, req.userId)

  if (!transaction) {
    return res.status(404).json({ error: 'Transacción no encontrada' })
  }

  res.json(toPublicTransaction(transaction))
})

router.put('/:id', (req, res) => {
  const result = validatePayload(req.body)

  if (result.error) {
    return res.status(400).json({ error: result.error })
  }

  const transaction = updateTransaction(req.params.id, req.userId, result.value)

  if (!transaction) {
    return res.status(404).json({ error: 'Transacción no encontrada' })
  }

  res.json(toPublicTransaction(transaction))
})

router.delete('/:id', (req, res) => {
  const result = deleteTransaction(req.params.id, req.userId)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Transacción no encontrada' })
  }

  res.status(204).end()
})

export default router