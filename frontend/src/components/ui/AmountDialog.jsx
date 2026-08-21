import { useEffect, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import PropTypes from 'prop-types'
import Button from './Button.jsx'

const toCents = (value) => {
  const parsed = Number.parseFloat(value)

  if (Number.isNaN(parsed)) return null

  return Math.round(parsed * 100)
}

const AmountDialog = ({
  open,
  title,
  description,
  confirmLabel,
  danger = false,
  maxAmount,
  onCancel,
  onConfirm
}) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) setValue('')
  }, [open])

  const cents = toCents(value)
  const isValid = cents !== null && cents > 0 && (!maxAmount || cents <= maxAmount)

  const handleSubmit = () => {
    if (!isValid) return

    onConfirm(cents)
    setValue('')
  }

  return (
    <Dialog open={open} onClose={onCancel} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </DialogTitle>
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
          <input
            autoFocus
            type="number"
            min="0.01"
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSubmit()
            }}
            placeholder="0,00"
            aria-label={title}
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {value !== '' && !isValid && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {maxAmount
                ? 'Ingresá un monto mayor a cero y dentro del disponible'
                : 'Ingresá un monto mayor a cero'}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant={danger ? 'danger' : 'primary'} disabled={!isValid} onClick={handleSubmit}>
              {confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

AmountDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  confirmLabel: PropTypes.string.isRequired,
  danger: PropTypes.bool,
  maxAmount: PropTypes.number,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
}

export default AmountDialog
