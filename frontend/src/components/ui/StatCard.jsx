import PropTypes from 'prop-types'

const TONES = {
  success: {
    chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    value: 'text-slate-900 dark:text-white'
  },
  danger: {
    chip: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    value: 'text-slate-900 dark:text-white'
  },
  warning: {
    chip: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    value: 'text-slate-900 dark:text-white'
  },
  brand: {
    chip: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
    value: 'text-indigo-600 dark:text-indigo-400'
  }
}

const StatCard = ({ label, value, icon: Icon, tone = 'brand' }) => {
  const toneClasses = TONES[tone] ?? TONES.brand

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className={`amount mt-1 truncate text-2xl font-bold ${toneClasses.value}`}>{value}</p>
        </div>
        {Icon && (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${toneClasses.chip}`}
            aria-hidden="true"
          >
            <Icon size={22} />
          </span>
        )}
      </div>
    </div>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  tone: PropTypes.oneOf(['success', 'danger', 'warning', 'brand'])
}

export default StatCard
