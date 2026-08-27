import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { CheckCircle2, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (message, type) => {
      toastId += 1
      const id = toastId
      setToasts((current) => [...current, { id, message, type }])
      setTimeout(() => dismissToast(id), 4000)
    },
    [dismissToast]
  )

  useEffect(() => () => setToasts([]), [])

  const value = useMemo(
    () => ({
      showSuccess: (message) => pushToast(message, 'success'),
      showError: (message) => pushToast(message, 'error')
    }),
    [pushToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex animate-toast-in items-start gap-3 rounded-xl border bg-white p-4 shadow-lg dark:bg-slate-900 ${
              toast.type === 'success'
                ? 'border-green-200 dark:border-green-500/30'
                : 'border-red-200 dark:border-red-500/30'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" aria-hidden="true" />
            ) : (
              <XCircle size={20} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
            )}
            <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Cerrar notificación"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export const useToast = () => useContext(ToastContext)
