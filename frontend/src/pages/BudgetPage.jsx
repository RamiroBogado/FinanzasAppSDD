import { useCallback, useEffect, useState } from 'react'
import { Plus, ReceiptText, Wallet } from 'lucide-react'
import { api, getToken } from '../api.js'
import { categoryColor } from '../categoryColor.js'
import { formatAmount, formatMonth } from '../format.js'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Field from '../components/ui/Field.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../components/ui/ToastProvider.jsx'
import { toMonthString, usePeriod } from '../context/PeriodContext.jsx'

const SUGGESTED_CATEGORIES = [
  'Comida',
  'Transporte',
  'Vivienda',
  'Sueldo',
  'Salud',
  'Entretenimiento',
  'Otros'
]

const EMPTY_FORM = { category: '', amount: '', threshold: '' }

const BudgetPage = () => {
  const token = getToken()
  const toast = useToast()
  const { month: periodMonth, year: periodYear } = usePeriod()
  const selectedMonth = toMonthString({ month: periodMonth, year: periodYear })
  const [budgets, setBudgets] = useState([])
  const [categoryOptions, setCategoryOptions] = useState(SUGGESTED_CATEGORIES)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [deletingBudget, setDeletingBudget] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(
    (selected) => {
      setLoading(true)
      api
        .listBudgets(token, { month: selected })
        .then((data) => {
          setBudgets(data)
          setCategoryOptions([
            ...new Set([...SUGGESTED_CATEGORIES, ...data.map((budget) => budget.category)])
          ])
        })
        .catch((err) => toast.showError(err.message))
        .finally(() => setLoading(false))
    },
    [token, toast]
  )

  useEffect(() => {
    refresh(selectedMonth)
  }, [selectedMonth, refresh])

  const recheckAlerts = () => {
    api
      .checkAlerts(token, selectedMonth)
      .then(() => window.dispatchEvent(new Event('alerts-updated')))
      .catch(() => {})
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const amount = Math.round(parseFloat(form.amount) * 100)

    if (!Number.isFinite(amount) || amount <= 0) {
      setValidationError('Ingresá un monto válido')
      return
    }

    const rawThreshold = form.threshold.trim()

    if (rawThreshold !== '') {
      const threshold = Number(rawThreshold)

      if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
        setValidationError('El umbral debe ser un número entero entre 1 y 100')
        return
      }
    }

    const payload = {
      category: form.category,
      month: selectedMonth,
      amount
    }

    if (rawThreshold !== '') {
      payload.threshold = Number(rawThreshold)
    }

    try {
      if (editingId) {
        await api.updateBudget(token, editingId, payload)
        toast.showSuccess('Presupuesto actualizado')
        setEditingId(null)
      } else {
        await api.createBudget(token, payload)
        toast.showSuccess('Presupuesto creado')
      }
      setForm(EMPTY_FORM)
      setValidationError(null)
      recheckAlerts()
      refresh(selectedMonth)
    } catch (err) {
      toast.showError(err.message)
    }
  }

  const handleEdit = (budget) => {
    setEditingId(budget.id)
    setForm({
      category: budget.category,
      amount: (budget.amount / 100).toString(),
      threshold: budget.threshold != null ? String(budget.threshold) : ''
    })
    setValidationError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setValidationError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingBudget) return

    try {
      await api.deleteBudget(token, deletingBudget.id)
      toast.showSuccess('Presupuesto eliminado')
      recheckAlerts()
      refresh(selectedMonth)
    } catch (err) {
      toast.showError(err.message)
    } finally {
      setDeletingBudget(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={editingId ? 'Editar presupuesto' : 'Presupuestos'}
        subtitle={
          editingId
            ? 'Modificá los datos y guardá los cambios.'
            : `Límites mensuales por categoría para ${formatMonth(selectedMonth)}.`
        }
      />

      <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff5ef] text-[#0e9f6e] dark:bg-[#0e9f6e]/10 dark:text-[#0e9f6e]">
            {editingId ? <ReceiptText size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
          </span>
          <h2 className="text-base font-semibold text-[#171d19] dark:text-white">
            {editingId ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Categoría">
            <Input
              name="category"
              type="text"
              maxLength={32}
              list="budget-category-suggestions"
              value={form.category}
              onChange={handleChange}
              placeholder="Categoría"
              className="mt-1"
            />
            <datalist id="budget-category-suggestions">
              {categoryOptions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </Field>
          <Field label="Monto mensual">
            <Input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="mt-1"
            />
          </Field>
          <Field label="Umbral de aviso (%)" htmlFor="budget-threshold">
            <Input
              id="budget-threshold"
              name="threshold"
              type="number"
              min="1"
              max="100"
              step="1"
              value={form.threshold}
              onChange={handleChange}
              placeholder="80"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
              Opcional. Se avisa cuando el gasto alcanza este porcentaje del límite.
            </p>
          </Field>
          <Field label="Mes">
            <Input type="month" value={selectedMonth} disabled className="mt-1 opacity-70" />
            <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
              Definido por el selector de período del menú.
            </p>
          </Field>
        </div>
        {validationError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400" role="alert">
            {validationError}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button type="submit">{editingId ? 'Guardar cambios' : 'Agregar presupuesto'}</Button>
          {editingId && (
            <Button variant="secondary" onClick={handleCancelEdit}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-semibold text-[#171d19] dark:text-white">{formatMonth(selectedMonth)}</h2>
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Sin presupuestos para este mes"
            description="Agregá uno desde el formulario de arriba."
          />
        ) : (
          <ul className="-mx-2 divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {budgets.map((budget) => {
              const threshold = budget.threshold ?? 80
              const ratio = budget.spent / budget.amount
              const percentage = Math.min(100, Math.round(ratio * 100))
              const exceeded = budget.spent > budget.amount
              const warningReached = !exceeded && ratio >= threshold / 100

              return (
                <li key={budget.id} className="group px-2 py-4 transition-colors hover:bg-[#F8FAFC] rounded-lg dark:hover:bg-slate-800/60">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          exceeded
                            ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                            : 'bg-[#eff5ef] text-[#0e9f6e] dark:bg-[#0e9f6e]/10 dark:text-[#0e9f6e]'
                        }`}
                      >
                        <Wallet size={16} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#171d19] dark:text-slate-100">
                          <span
                            className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                            style={{ backgroundColor: categoryColor(budget.category) }}
                            aria-hidden="true"
                          />
                          {budget.category}
                          {exceeded && (
                            <span className="ml-2 inline-block rounded-full bg-red-50 px-2 py-0.5 align-middle text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                              Presupuesto excedido
                            </span>
                          )}
                          {warningReached && (
                            <span className="ml-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 align-middle text-xs font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                              Umbral alcanzado ({threshold}%)
                            </span>
                          )}
                        </p>
                        <p className="amount text-xs text-[#64748B] dark:text-slate-400">
                          {formatAmount(budget.spent)} de {formatAmount(budget.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          exceeded
                            ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                            : warningReached
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                        }`}
                      >
                        {percentage}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEdit(budget)}
                        className="rounded-md px-2 py-1 text-sm font-medium text-[#64748B] opacity-100 transition-all sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100 hover:bg-slate-100 hover:text-[#0e9f6e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] group-hover:opacity-100 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-[#0e9f6e]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingBudget(budget)}
                        className="rounded-md px-2 py-1 text-sm font-medium text-[#64748B] opacity-100 transition-all sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 group-hover:opacity-100 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-2 rounded-full transition-[width] duration-500 ${
                        exceeded ? 'bg-red-600' : warningReached ? 'bg-amber-500' : 'bg-[#0e9f6e]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deletingBudget)}
        title="¿Eliminar este presupuesto?"
        description="Esta acción no se puede deshacer."
        onCancel={() => setDeletingBudget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default BudgetPage
