import { useEffect, useState } from 'react'
import { api, getToken } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatAmount, formatDate, toLocalDate } from '../format.js'

const EMPTY_FORM = { type: 'expense', amount: '', date: toLocalDate(new Date()), description: '' }

const AppPage = () => {
  const { user, logout } = useAuth()
  const token = getToken()
  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listTransactions(token)
      .then(setTransactions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const loadTransactions = () =>
    api
      .listTransactions(token)
      .then(setTransactions)
      .catch((err) => setError(err.message))

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

    const payload = { type: form.type, amount, date: form.date, description: form.description }

    try {
      if (editingId) {
        await api.updateTransaction(token, editingId, payload)
        setEditingId(null)
      } else {
        await api.createTransaction(token, payload)
      }
      setForm(EMPTY_FORM)
      setError(null)
      await loadTransactions()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (transaction) => {
    setEditingId(transaction.id)
    setForm({
      type: transaction.type,
      amount: (transaction.amount / 100).toString(),
      date: transaction.date,
      description: transaction.description ?? ''
    })
    setError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteTransaction(token, id)
      setError(null)
      await loadTransactions()
    } catch (err) {
      setError(err.message)
    }
  }

  const totalByType = (type) =>
    transactions
      .filter((transaction) => transaction.type === type)
      .reduce((sum, transaction) => sum + transaction.amount, 0)

  const totalIncome = totalByType('income')
  const totalExpense = totalByType('expense')
  const balance = totalIncome - totalExpense

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between rounded-lg bg-white p-4 shadow">
          <h1 className="text-2xl font-semibold text-slate-800">{user.username}</h1>
          <button
            onClick={logout}
            className="rounded bg-slate-800 py-2 px-4 text-white hover:bg-slate-700"
          >
            Cerrar sesión
          </button>
        </header>

        {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

        <section className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white p-4 text-center shadow">
            <p className="text-sm text-slate-500">Total de ingresos</p>
            <p className="text-lg font-semibold text-green-600">{formatAmount(totalIncome)}</p>
          </div>
          <div className="rounded-lg bg-white p-4 text-center shadow">
            <p className="text-sm text-slate-500">Total de gastos</p>
            <p className="text-lg font-semibold text-red-600">{formatAmount(totalExpense)}</p>
          </div>
          <div className="rounded-lg bg-white p-4 text-center shadow">
            <p className="text-sm text-slate-500">Saldo</p>
            <p
              className={`text-lg font-semibold ${balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}
            >
              {formatAmount(balance)}
            </p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="mb-4 grid grid-cols-2 gap-4">
            <label className="block text-sm text-slate-600">
              Tipo
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              >
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
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
            <label className="block text-sm text-slate-600">
              Fecha
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="block text-sm text-slate-600">
              Descripción
              <input
                name="description"
                type="text"
                maxLength={255}
                value={form.description}
                onChange={handleChange}
                placeholder="Descripción opcional"
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-slate-800 py-2 px-4 text-white hover:bg-slate-700"
            >
              {editingId ? 'Guardar cambios' : 'Agregar transacción'}
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
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Tus transacciones</h2>
          {loading ? (
            <p className="text-slate-500">Cargando transacciones…</p>
          ) : transactions.length === 0 ? (
            <p className="text-slate-500">Aún no tenés transacciones</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {transaction.description ||
                        (transaction.type === 'income' ? 'Ingreso' : 'Gasto')}
                    </p>
                    <p className="text-sm text-slate-500">{formatDate(transaction.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatAmount(transaction.amount)}
                    </span>
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-sm text-slate-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default AppPage