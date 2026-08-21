import PropTypes from 'prop-types'

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`} />
)

Skeleton.propTypes = {
  className: PropTypes.string
}

export default Skeleton
