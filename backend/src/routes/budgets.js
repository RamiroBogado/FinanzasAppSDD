import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  createBudget,
  deleteBudget,
  findBudgetById,
  listBudgets,
  toPublicBudget,
  updateBudget
} from '../budgets.js'

const router = Router()

const MAX_CATEGORY_LENGTH = 32
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

function validatePayload(body) {
  const { category, month, amount, threshold } = body ?? {}

  if (typeof category !== 'string' || category.trim() === '') {
    return { error: 'La categoría es obligatoria' }
  }

  if (category.trim().length > MAX_CATEGORY_LENGTH) {
    return { error: 'La categoría no puede superar los 32 caracteres' }
  }

  if (typeof month !== 'string' || !MONTH_PATTERN.test(month)) {
    return { error: 'El mes debe tener formato AAAA-MM' }
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: 'El monto debe ser un número entero positivo (en centavos)' }
  }

  let normalizedThreshold = null

  if (threshold !== undefined && threshold !== null && threshold !== '') {
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
      return { error: 'El umbral debe ser un número entero entre 1 y 100' }
    }

    normalizedThreshold = threshold
  }

  return { value: { category: category.trim(), month, amount, threshold: normalizedThreshold } }
}

router.use(requireAuth)

router.post('/', (req, res) => {
  const result = validatePayload(req.body)

  if (result.error) {
    return res.status(400).json({ error: result.error })
  }

  try {
    const budget = createBudget({
      userId: req.userId,
      ...result.value,
      threshold: result.value.threshold ?? 80
    })

    res.status(201).json(toPublicBudget(budget))
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Ya existe un presupuesto para esa categoría y mes' })
    }

    throw err
  }
})

router.get('/', (req, res) => {
  const { month, category } = req.query

  if (month !== undefined && (typeof month !== 'string' || !MONTH_PATTERN.test(month))) {
    return res.status(400).json({ error: 'El mes debe tener formato AAAA-MM' })
  }

  const budgets = listBudgets(req.userId, {
    month: typeof month === 'string' ? month : undefined,
    category: typeof category === 'string' ? category : undefined
  })

  res.json(budgets.map(toPublicBudget))
})

router.get('/:id', (req, res) => {
  const budget = findBudgetById(req.params.id, req.userId)

  if (!budget) {
    return res.status(404).json({ error: 'Presupuesto no encontrado' })
  }

  res.json(toPublicBudget(budget))
})

router.put('/:id', (req, res) => {
  const result = validatePayload(req.body)

  if (result.error) {
    return res.status(400).json({ error: result.error })
  }

  try {
    const budget = updateBudget(req.params.id, req.userId, result.value)

    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    res.json(toPublicBudget(budget))
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Ya existe un presupuesto para esa categoría y mes' })
    }

    throw err
  }
})

router.delete('/:id', (req, res) => {
  const result = deleteBudget(req.params.id, req.userId)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Presupuesto no encontrado' })
  }

  res.status(204).end()
})

export default router