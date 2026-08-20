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