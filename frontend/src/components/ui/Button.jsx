import PropTypes from 'prop-types'

const VARIANTS = {
  primary:
    'bg-[#0e9f6e] text-white shadow-sm hover:bg-[#0a7a53] active:bg-[#006947] dark:bg-[#0e9f6e] dark:hover:bg-[#0a7a53]',
  secondary:
    'bg-white text-[#3d4a42] border border-[#E2E8F0] hover:bg-[#eff5ef] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-700',
  ghost:
    'text-[#3d4a42] hover:bg-[#eff5ef] hover:text-[#171d19] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  danger: 'bg-[#E11D48] text-white shadow-sm hover:bg-[#c81a3f] active:bg-[#9f1a36]'
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base'
}

const Button = ({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    {...props}
  />
)

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  type: PropTypes.string
}

export default Button
