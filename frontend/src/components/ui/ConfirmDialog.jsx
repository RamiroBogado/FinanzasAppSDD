import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { AlertTriangle } from 'lucide-react'
import PropTypes from 'prop-types'
import Button from './Button.jsx'

const ConfirmDialog = ({ open, title, description, onCancel, onConfirm }) => (
  <Dialog open={open} onClose={onCancel} className="relative z-50">
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <AlertTriangle size={20} aria-hidden="true" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </DialogTitle>
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Eliminar
          </Button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
)

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
}

export default ConfirmDialog
