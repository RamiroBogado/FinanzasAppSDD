import PropTypes from 'prop-types'

const Field = ({ label, htmlFor, children, className = '' }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-slate-700 dark:text-slate-300 ${className}`}
  >
    {label}
    {children}
  </label>
)

Field.propTypes = {
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

export default Field
