import PropTypes from 'prop-types'

const PageHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-semibold tracking-tight text-[#171d19] dark:text-white">{title}</h1>
    {subtitle && <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">{subtitle}</p>}
  </div>
)

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string
}

export default PageHeader
