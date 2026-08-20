import { useCallback, useEffect, useState } from 'react'
import { api, getToken } from '../api.js'
import { formatAmount, formatMonth, toLocalDate } from '../format.js'

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
  const [budgets, setBudgets] = useState([])
  const [month, setMonth] = useState(currentMonth())
  const [categoryOptions, setCategoryOptions] = useState(SUGGESTED_CATEGORIES)
  const [form, setForm] = useState({
    category: '',
    month: currentMonth(),
    amount: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)
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
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    },
    [token]
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
      setError('Ingresá un monto válido')
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
        setEditingId(null)
      } else {
        await api.createBudget(token, payload)
      }
      setForm({ category: '', month: currentMonth(), amount: '' })
      setError(null)
      setMonth(payload.month)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (budget) => {
    setEditingId(budget.id)
    setForm({
      category: budget.category,
      month: budget.month,
      amount: (budget.amount / 100).toString()
    })
    setError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({ category: '', month: currentMonth(), amount: '' })
    setError(null)
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteBudget(token, id)
      setError(null)
      refresh(month)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Presupuestos</h1>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

      <section className="mb-6 rounded-lg bg-white p-4 shadow">
        <label className="block text-sm text-slate-600">
          Mes
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="mt-1 rounded border border-slate-300 px-2 py-1"
          />
        </label>
      </section>

      <form onSubmit={handleSubmit} className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="mb-4 grid grid-cols-3 gap-4">
          <label className="block text-sm text-slate-600">
            Categoría
            <input
              name="category"
              type="text"
              maxLength={32}
              list="budget-category-suggestions"
              value={form.category}
              onChange={handleChange}
              placeholder="Categoría"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
            <datalist id="budget-category-suggestions">
              {categoryOptions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </label>
          <label className="block text-sm text-slate-600">
            Mes
            <input
              name="month"
              type="month"
              value={form.month}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="block text-sm text-slate-600">
            Monto
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-slate-800 py-2 px-4 text-white hover:bg-slate-700"
          >
            {editingId ? 'Guardar cambios' : 'Agregar presupuesto'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded bg-slate-200 py-2 px-4 text-slate-700 hover:bg-slate-300"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">{formatMonth(month)}</h2>
        {loading ? (
          <p className="text-slate-500">Cargando presupuestos…</p>
        ) : budgets.length === 0 ? (
          <p className="text-slate-500">Sin presupuestos para este mes</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {budgets.map((budget) => {
              const percentage = Math.min(100, Math.round((budget.spent / budget.amount) * 100))
              const exceeded = budget.spent > budget.amount

              return (
                <li key={budget.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{budget.category}</p>
                      <p className="text-sm text-slate-500">
                        {formatAmount(budget.spent)} de {formatAmount(budget.amount)} ({percentage}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {exceeded && (
                        <span className="text-sm font-semibold text-red-600">
                          Presupuesto excedido
                        </span>
                      )}
                      <button
                        onClick={() => handleEdit(budget)}
                        className="text-sm text-slate-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-200">
                    <div
                      className={`h-2 rounded ${exceeded ? 'bg-red-600' : 'bg-green-600'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

export default BudgetPage