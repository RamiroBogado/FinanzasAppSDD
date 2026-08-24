import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

const PeriodContext = createContext(null)

const STORAGE_KEY = 'finanzasapp-period'

const isValidPeriod = (value) =>
  value &&
  Number.isInteger(value.month) &&
  value.month >= 1 &&
  value.month <= 12 &&
  Number.isInteger(value.year) &&
  value.year >= 2000 &&
  value.year <= 2100

export const toMonthString = ({ month, year }) =>
  `${year}-${String(month).padStart(2, '0')}`

export function periodRange({ month, year }) {
  const lastDay = new Date(year, month, 0).getDate()
  const monthNumber = String(month).padStart(2, '0')

  return {
    from: `${year}-${monthNumber}-01`,
    to: `${year}-${monthNumber}-${lastDay}`
  }
}

export function monthsWindow(period, count = 6) {
  const months = []

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(period.year, period.month - 1 - offset, 1)
    months.push({ year: date.getFullYear(), month: date.getMonth() + 1 })
  }

  return months
}

export function PeriodProvider({ children }) {
  const [period, setPeriod] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))

      if (isValidPeriod(saved)) {
        return saved
      }
    } catch {
      /* usar el período actual */
    }

    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(period))
  }, [period])

  const value = { ...period, setPeriod: (month, year) => setPeriod({ month, year }) }

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
}

PeriodProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export const usePeriod = () => useContext(PeriodContext)
