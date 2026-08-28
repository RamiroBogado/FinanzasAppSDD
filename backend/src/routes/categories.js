import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  createCategory,
  deleteCategory,
  findCategoryById,
  listCategories,
  updateCategory
} from '../categories.js'

const router = Router()

const PALETTE = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#f59e0b', '#ef4444',
  '#10b981', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'
]

const CATEGORY_TYPES = ['income', 'expense']
const MAX_NAME_LENGTH = 32

function validatePayload(body) {
  const { name, type, color } = body ?? {}

  if (typeof name !== 'string' || name.trim() === '' || name.length > MAX_NAME_LENGTH) {
    return { error: 'El nombre es obligatorio y no puede superar los 32 caracteres' }
  }

  if (typeof type !== 'string' || !CATEGORY_TYPES.includes(type)) {
    return { error: 'El tipo debe ser income o expense' }
  }

  if (typeof color !== 'string' || !PALETTE.includes(color)) {
    return { error: 'Color no válido' }
  }

  return {
    value: {
      name: name.trim(),
      type,
      color
    }
  }
}

function validatePartialPayload(body) {
  const { name, type, color } = body ?? {}

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '' || name.length > MAX_NAME_LENGTH) {
      return { error: 'El nombre no puede superar los 32 caracteres' }
    }
  }

  if (type !== undefined && (typeof type !== 'string' || !CATEGORY_TYPES.includes(type))) {
    return { error: 'El tipo debe ser income o expense' }
  }

  if (color !== undefined && (typeof color !== 'string' || !PALETTE.includes(color))) {
    return { error: 'Color no válido' }
  }

  return { value: { name: name?.trim(), type, color } }
}

router.use(requireAuth)

router.get('/', (req, res) => {
  const categories = listCategories(req.userId)
  res.json(categories)
})

router.post('/', (req, res) => {
  const result = validatePayload(req.body)

  if (result.error) {
    return res.status(400).json({ error: result.error })
  }

  try {
    const category = createCategory({ userId: req.userId, ...result.value })
    res.status(201).json(category)
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' })
    }
    throw err
  }
})

router.put('/:id', (req, res) => {
  const result = validatePartialPayload(req.body)

  if (result.error) {
    return res.status(400).json({ error: result.error })
  }

  const existing = findCategoryById(req.params.id, req.userId)
  if (!existing) {
    return res.status(404).json({ error: 'Categoría no encontrada' })
  }

  try {
    const category = updateCategory(req.params.id, req.userId, result.value)
    res.json(category)
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' })
    }
    throw err
  }
})

router.delete('/:id', (req, res) => {
  const existing = findCategoryById(req.params.id, req.userId)
  if (!existing) {
    return res.status(404).json({ error: 'Categoría no encontrada' })
  }

  const inUse = deleteCategory(req.params.id, req.userId)
  if (inUse) {
    return res.status(409).json({ error: 'No se puede eliminar: la categoría está en uso' })
  }

  res.status(204).send()
})

export default router