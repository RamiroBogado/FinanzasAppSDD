import { useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowDownRight, ArrowUpRight, PieChart as PieChartIcon, ReceiptText, Wallet } from 'lucide-react'
import { api, getToken } from '../api.js'
import { formatAmount, formatDate } from '../format.js'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

const DONUT_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#a855f7',
  '#84cc16',
  '#f97316',
  '#ec4899',
  '#14b8a6'
]

const DashboardSkeleton = () => (
  <div>
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-24 rounded-xl" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  </div>
)

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

  const donutData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }))
  const recentTransactions = transactions.slice(0, 10)

  const summaryCards = [
    { label: 'Total de ingresos', value: formatAmount(totalIncome), icon: ArrowUpRight, iconClass: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400', valueClass: 'text-green-600' },
    { label: 'Total de gastos', value: formatAmount(totalExpense), icon: ArrowDownRight, iconClass: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', valueClass: 'text-red-600' },
    { label: 'Saldo', value: formatAmount(balance), icon: Wallet, iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400', valueClass: balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600' }
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {summaryCards.map(({ label, value, icon: Icon, iconClass, valueClass }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                  <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
                Distribución de gastos
              </h2>
              {donutData.length === 0 ? (
                <EmptyState icon={PieChartIcon} title="Sin gastos categorizados" />
              ) : (
                <div className="relative h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={entry.name} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatAmount(value)}
                        contentStyle={{
                          borderRadius: '0.5rem',
                          border: '1px solid rgb(203 213 225)',
                          fontSize: '0.8rem',
                          backgroundColor: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Total gastado
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatAmount(totalExpense)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Gastos por categoría</h2>
              {Object.keys(expensesByCategory).length === 0 ? (
                <EmptyState icon={PieChartIcon} title="Sin gastos categorizados" />
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(expensesByCategory).map(([category, amount], index) => (
                    <li key={category} className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                          aria-hidden="true"
                        />
                        {category}
                      </span>
                      <span className="text-sm font-medium text-red-600">{formatAmount(amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Últimos movimientos</h2>
            {recentTransactions.length === 0 ? (
              <EmptyState icon={ReceiptText} title="Sin movimientos" />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((transaction) => (
                  <li key={transaction.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {transaction.description ||
                          (transaction.type === 'income' ? 'Ingreso' : 'Gasto')}
                        {transaction.category && (
                          <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            {transaction.category}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatAmount(transaction.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardPage
