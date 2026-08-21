import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  createGoal,
  deleteGoal,
  findGoalById,
  listGoals,
  toPublicGoal,
  updateGoal
} from '../goals.js'

const router = Router()

const MAX_NAME_LENGTH = 80
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function validateDeadline(deadline) {
  if (deadline === undefined || deadline === null || deadline === '') {
    return { value: null }
  }

  if (
    typeof deadline !== 'string' ||
    !DATE_PATTERN.test(deadline) ||
    Number.isNaN(Date.parse(deadline))
  ) {
    return { error: 'La fecha límite debe tener formato AAAA-MM-DD' }
  }

  return { value: deadline }
}

function validatePayload(body) {
  const { name, targetAmount, savedAmount, deadline } = body ?? {}

  if (typeof name !== 'string' || name.trim() === '') {
    return { error: 'El nombre es obligatorio' }
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    return { error: 'El nombre no puede superar los 80 caracteres' }
  }

  if (!Number.isInteger(targetAmount) || targetAmount <= 0) {
    return { error: 'El monto objetivo debe ser un número entero positivo (en centavos)' }
  }

  let validatedSavedAmount = 0

  if (savedAmount !== undefined && savedAmount !== null) {
    if (!Number.isInteger(savedAmount) || savedAmount < 0) {
      return { error: 'El monto ahorrado debe ser un número entero no negativo (en centavos)' }
    }

    validatedSavedAmount = savedAmount
  }

  const deadlineResult = validateDeadline(deadline)

  if (deadlineResult.error) {
    return deadlineResult
  }

  return {
    value: {
      name: name.trim(),
      targetAmount,
      savedAmount: validatedSavedAmount,
      deadline: deadlineResult.value
    }
  }
}

router.use(requireAuth)

router.post('/', (req, res) => {
  const result = validatePayload(req.body)

  if (result.error) {
    return res.status(400).json({ error: result.error })
  }

  const goal = createGoal({ userId: req.userId, ...result.value })

  res.status(201).json(toPublicGoal(goal))
})

router.get('/', (req, res) => {
  const goals = listGoals(req.userId)

  res.json(goals.map(toPublicGoal))
})

router.get('/:id', (req, res) => {
  const goal = findGoalById(req.params.id, req.userId)

  if (!goal) {
    return res.status(404).json({ error: 'Meta de ahorro no encontrada' })
  }

  res.json(toPublicGoal(goal))
})

router.put('/:id', (req, res) => {
  const result = validatePayload(req.body)

  if (result.error) {
    return res.status(400).json({ error: result.error })
  }

  const goal = updateGoal(req.params.id, req.userId, result.value)

  if (!goal) {
    return res.status(404).json({ error: 'Meta de ahorro no encontrada' })
  }

  res.json(toPublicGoal(goal))
})

router.delete('/:id', (req, res) => {
  const result = deleteGoal(req.params.id, req.userId)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Meta de ahorro no encontrada' })
  }

  res.status(204).end()
})

export default router
