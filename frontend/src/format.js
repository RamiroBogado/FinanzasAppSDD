export function formatAmount(cents) {
  return (cents / 100).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  })
}

export function formatDate(date) {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

export function toLocalDate(value) {
  return new Date(value).toLocaleDateString('sv')
}

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
]

export function formatMonth(month) {
  const [year, monthNumber] = month.split('-')
  const index = parseInt(monthNumber, 10) - 1
  const name = MONTHS_ES[index] ?? month
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1)

  return `${capitalized} ${year}`
}