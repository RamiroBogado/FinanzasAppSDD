import { useCallback, useEffect, useState } from 'react'
import { Plus, ReceiptText, Wallet } from 'lucide-react'
import { api, getToken } from '../api.js'
import { formatAmount, formatMonth, toLocalDate } from '../format.js'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Field from '../components/ui/Field.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../components/ui/ToastProvider.jsx'

const SUGGESTED_CATEGORIES = [
  'Comida',
  'Transporte',
  'Vivienda',
  'Sueldo',
  'Salud',
  'Entretenimiento',
  'Otros'
]

const currentMonth = () => toLocalDate(new Date()).slice(0, 7)

const BudgetPage = () => {
  const token = getToken()
  const toast = useToast()
  const [budgets, setBudgets] = useState([])
  const [month, setMonth] = useState(currentMonth())
  const [categoryOptions, setCategoryOptions] = useState(SUGGESTED_CATEGORIES)
  const [form, setForm] = useState({
    category: '',
    month: currentMonth(),
    amount: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [deletingBudget, setDeletingBudget] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(
    (selectedMonth) => {
      setLoading(true)
      api
        .listBudgets(token, { month: selectedMonth })
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
    refresh(month)
  }, [month, refresh])

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

    const payload = {
      category: form.category,
      month: form.month,
      amount
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
      setForm({ category: '', month: currentMonth(), amount: '' })
      setValidationError(null)
      setMonth(payload.month)
    } catch (err) {
      toast.showError(err.message)
    }
  }

  const handleEdit = (budget) => {
    setEditingId(budget.id)
    setForm({
      category: budget.category,
      month: budget.month,
      amount: (budget.amount / 100).toString()
    })
    setValidationError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({ category: '', month: currentMonth(), amount: '' })
    setValidationError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingBudget) return

    try {
      await api.deleteBudget(token, deletingBudget.id)
      toast.showSuccess('Presupuesto eliminado')
      refresh(month)
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
            : 'Definí límites mensuales por categoría y seguí cuánto llevás gastado.'
        }
      />

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <Field label="Mes del listado" htmlFor="budget-month-selector">
          <Input
            id="budget-month-selector"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="mt-1 max-w-xs"
          />
        </Field>
      </section>

      <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            {editingId ? <ReceiptText size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
          </span>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {editingId ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <Field label="Mes">
            <Input name="month" type="month" value={form.month} onChange={handleChange} className="mt-1" />
          </Field>
          <Field label="Monto">
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

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{formatMonth(month)}</h2>
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
          <ul className="-mx-2 divide-y divide-slate-100 dark:divide-slate-800">
            {budgets.map((budget) => {
              const percentage = Math.min(100, Math.round((budget.spent / budget.amount) * 100))
              const exceeded = budget.spent > budget.amount

              return (
                <li key={budget.id} className="group px-2 py-4 transition-colors hover:bg-slate-50 rounded-lg dark:hover:bg-slate-800/60">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          exceeded
                            ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                        }`}
                      >
                        <Wallet size={16} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {budget.category}
                          {exceeded && (
                            <span className="ml-2 inline-block rounded-full bg-red-50 px-2 py-0.5 align-middle text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                              Presupuesto excedido
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatAmount(budget.spent)} de {formatAmount(budget.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          exceeded
                            ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                            : percentage >= 80
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                        }`}
                      >
                        {percentage}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEdit(budget)}
                        className="rounded-md px-2 py-1 text-sm font-medium text-slate-500 opacity-100 transition-all sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100 hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 group-hover:opacity-100 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingBudget(budget)}
                        className="rounded-md px-2 py-1 text-sm font-medium text-slate-500 opacity-100 transition-all sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 group-hover:opacity-100 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-2 rounded-full transition-[width] duration-500 ${
                        exceeded ? 'bg-red-600' : percentage >= 80 ? 'bg-amber-500' : 'bg-indigo-600'
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
