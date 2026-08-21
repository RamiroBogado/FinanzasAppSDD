import PropTypes from 'prop-types'

const EmptyState = ({ icon: Icon, title, description, children }) => (
  <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
    {Icon && (
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon size={24} aria-hidden="true" />
      </div>
    )}
    <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
    {description && (
      <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
    )}
    {children}
  </div>
)

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node
}

export default EmptyState
