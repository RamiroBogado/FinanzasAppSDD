const PALETTE = [
  '#6366f1',
  '#f59e0b',
  '#14b8a6',
  '#ec4899',
  '#8b5cf6',
  '#0ea5e9',
  '#84cc16',
  '#f97316',
  '#06b6d4',
  '#a855f7'
]

export function categoryColor(name) {
  const normalized = (name ?? '').trim().toLowerCase()
  let hash = 0x811c9dc5

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function getCategoryColor(name, userCategories = []) {
  const match = userCategories.find(
    (category) => category.name.toLowerCase() === (name ?? '').trim().toLowerCase()
  )

  return match?.color || categoryColor(name)
}
