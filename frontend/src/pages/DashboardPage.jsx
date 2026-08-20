import { useEffect, useState } from 'react'
import { api, getToken } from '../api.js'
import { formatAmount, formatDate } from '../format.js'

const DashboardPage = () => {
  const token = getToken()
  const [transactions, setTransactions] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listTransactions(token)
      .then(setTransactions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const totalByType = (type) =>
    transactions
      .filter((transaction) => transaction.type === type)
      .reduce((sum, transaction) => sum + transaction.amount, 0)

  const totalIncome = totalByType('income')
  const totalExpense = totalByType('expense')
  const balance = totalIncome - totalExpense

  const expensesByCategory = transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.category)
    .reduce((accumulator, transaction) => {
      accumulator[transaction.category] =
        (accumulator[transaction.category] ?? 0) + transaction.amount
      return accumulator
    }, {})

  const recentTransactions = transactions.slice(0, 10)

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Dashboard</h1>

      {error && <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Cargando tus finanzas…</p>
      ) : (
        <>
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

          <section className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Gastos por categoría</h2>
              {Object.keys(expensesByCategory).length === 0 ? (
                <p className="text-slate-500">Sin gastos categorizados</p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {Object.entries(expensesByCategory).map(([category, amount]) => (
                    <li key={category} className="flex items-center justify-between py-2">
                      <span className="text-slate-700">{category}</span>
                      <span className="text-red-600">{formatAmount(amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Últimos movimientos</h2>
              {recentTransactions.length === 0 ? (
                <p className="text-slate-500">Sin movimientos</p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {recentTransactions.map((transaction) => (
                    <li key={transaction.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-slate-800">
                          {transaction.description ||
                            (transaction.type === 'income' ? 'Ingreso' : 'Gasto')}
                          {transaction.category && (
                            <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {transaction.category}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <span
                        className={
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatAmount(transaction.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardPage