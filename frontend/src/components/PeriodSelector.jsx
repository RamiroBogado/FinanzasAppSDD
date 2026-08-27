import { usePeriod } from '../context/PeriodContext.jsx'

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
]

const selectClass =
  'rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-sm font-medium text-[#3d4a42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'

const PeriodSelector = () => {
  const { month, year, setPeriod } = usePeriod()
  const now = new Date()
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].filter(
    (value, index, list) => list.indexOf(value) === index
  )

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Mes del período"
        value={month}
        onChange={(event) => setPeriod(Number(event.target.value), year)}
        className={selectClass}
      >
        {MONTHS.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        aria-label="Año del período"
        value={year}
        onChange={(event) => setPeriod(month, Number(event.target.value))}
        className={selectClass}
      >
        {[...new Set([...years, year])].sort((a, b) => a - b).map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  )
}

export default PeriodSelector
