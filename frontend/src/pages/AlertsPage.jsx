import { useCallback, useEffect, useState } from 'react'
import { BellOff, CheckCheck, TriangleAlert } from 'lucide-react'
import { api, getToken } from '../api.js'
import { formatDate } from '../format.js'
import Button from '../components/ui/Button.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useToast } from '../components/ui/ToastProvider.jsx'

const TYPE_LABELS = {
  warning: 'Aviso',
  danger: 'Presupuesto excedido'
}

const AlertsPage = () => {
  const token = getToken()
  const toast = useToast()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const refresh = useCallback(() => {
    api
      .listAlerts(token)
      .then(setAlerts)
      .catch((err) => toast.showError(err.message))
      .finally(() => setLoading(false))
  }, [token, toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  const announceChange = () => window.dispatchEvent(new Event('alerts-updated'))

  const handleMarkRead = async (alert) => {
    try {
      await api.markAlertRead(token, alert.id)
      setAlerts((current) =>
        current.map((item) => (item.id === alert.id ? { ...item, read: true } : item))
      )
      announceChange()
    } catch (err) {
      toast.showError(err.message)
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)

    try {
      await api.markAllAlertsRead(token)
      setAlerts((current) => current.map((item) => ({ ...item, read: true })))
      announceChange()
      toast.showSuccess('Todas las alertas fueron marcadas como leídas')
    } catch (err) {
      toast.showError(err.message)
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = alerts.filter((alert) => !alert.read).length

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Alertas"
          subtitle="Avisos generados cuando tus gastos se acercan o superan tus presupuestos."
        />
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="mb-6"
          >
            <CheckCheck size={14} aria-hidden="true" />
            {markingAll ? 'Marcando…' : 'Marcar todas como leídas'}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Sin alertas por ahora"
          description="Te vamos a avisar cuando un gasto se acerque al límite de un presupuesto."
        />
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`rounded-xl border p-4 shadow-card ${
                alert.read
                  ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  : alert.type === 'danger'
                    ? 'border-red-200 bg-red-50/60 dark:border-red-500/30 dark:bg-red-500/10'
                    : 'border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        alert.type === 'danger'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                      }`}
                    >
                      <TriangleAlert size={11} className="mr-1 inline" aria-hidden="true" />
                      {TYPE_LABELS[alert.type] ?? alert.type}
                    </span>
                  </p>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      alert.read
                        ? 'text-slate-600 dark:text-slate-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {alert.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(alert.createdAt.slice(0, 10))}
                  </p>
                </div>
                {!alert.read && (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkRead(alert)}>
                    Marcar leída
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AlertsPage
