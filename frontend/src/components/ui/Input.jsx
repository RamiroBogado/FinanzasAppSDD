import PropTypes from 'prop-types'

const FIELD_CLASSES =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#171d19] placeholder:text-slate-400 transition-colors focus:border-[#0e9f6e] focus:outline-none focus:ring-2 focus:ring-[#0e9f6e]/40 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-[#64748B]'

const Input = ({ className = '', ...props }) => (
  <input className={`${FIELD_CLASSES} ${className}`} {...props} />
)

const Select = ({ className = '', children, ...props }) => (
  <select className={`${FIELD_CLASSES} ${className}`} {...props}>
    {children}
  </select>
)

Input.propTypes = { className: PropTypes.string }
Select.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}

export { FIELD_CLASSES, Select }
export default Input
