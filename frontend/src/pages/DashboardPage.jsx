import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, XAxis, YAxis } from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  PieChart as PieChartIcon,
  ReceiptText,
  Target,
  Wallet
} from 'lucide-react'
import { api, getToken } from '../api.js'
import { categoryColor } from '../categoryColor.js'
import { formatAmount, formatDate, formatMonth } from '../format.js'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import { monthsWindow, periodRange, toMonthString, usePeriod } from '../context/PeriodContext.jsx'

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const tooltipStyle = {
  borderRadius: '0.5rem',
  border: '1px solid rgb(203 213 225)',
  fontSize: '0.8rem',
  backgroundColor: 'white'
}

const DashboardSkeleton = () => (
  <div>
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
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
  const { month, year } = usePeriod()
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    const range = periodRange({ month, year })
    const sixMonths = monthsWindow({ month, year }, 6)
    const windowFrom = `${sixMonths[0].year}-${String(sixMonths[0].month).padStart(2, '0')}-01`

    Promise.all([
      api.listTransactions(token, { from: windowFrom, to: range.to }),
      api.listGoals(token).catch(() => []),
      api.listAlerts(token).catch(() => [])
    ])
      .then(([transactionData, goalData, alertData]) => {
        setTransactions(transactionData)
        setGoals(goalData)
        setAlerts(alertData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token, month, year])

  useEffect(() => {
    let active = true

    api
      .checkAlerts(token, toMonthString({ month, year }))
      .then((result) => {
        window.dispatchEvent(new Event('alerts-updated'))

        if (!active) {
          return null
        }

        return result.created.length > 0 ? api.listAlerts(token) : null
      })
      .then((alertData) => {
        if (active && alertData) {
          setAlerts(alertData)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [token, month, year])

  const range = periodRange({ month, year })

  const inPeriod = useMemo(
    () =>
      transactions.filter(
        (transaction) => transaction.date >= range.from && transaction.date <= range.to
      ),
    [transactions, range]
  )

  const totalByType = (type) =>
    inPeriod
      .filter((transaction) => transaction.type === type)
      .reduce((sum, transaction) => sum + transaction.amount, 0)

  const totalIncome = totalByType('income')
  const totalExpense = totalByType('expense')
  const balance = totalIncome - totalExpense
  const totalSaved = goals.reduce((sum, goal) => sum + (goal.savedAmount ?? 0), 0)

  const expensesByCategory = inPeriod
    .filter((transaction) => transaction.type === 'expense' && transaction.category)
    .reduce((accumulator, transaction) => {
      accumulator[transaction.category] =
        (accumulator[transaction.category] ?? 0) + transaction.amount
      return accumulator
    }, {})

  const donutData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }))
  const recentTransactions = inPeriod.slice(-10).reverse()

  const evolutionData = useMemo(() => {
    const sixMonths = monthsWindow({ month, year }, 6)

    return sixMonths.map(({ month: m, year: y }) => {
      const key = `${y}-${String(m).padStart(2, '0')}`

      return {
        label: MONTHS_SHORT[m - 1],
        key,
        ingresos: transactions
          .filter((t) => t.date.startsWith(key) && t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        gastos: transactions
          .filter((t) => t.date.startsWith(key) && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
      }
    })
  }, [transactions, month, year])

  const unreadAlerts = alerts.filter((alert) => !alert.read)

  const summaryCards = [
    { label: 'Ingresos', value: formatAmount(totalIncome), icon: ArrowUpRight, tone: 'success' },
    { label: 'Gastos', value: formatAmount(totalExpense), icon: ArrowDownRight, tone: 'danger' },
    { label: 'Balance', value: formatAmount(balance), icon: Wallet, tone: 'brand' },
    { label: 'Ahorrado en metas', value: formatAmount(totalSaved), icon: Target, tone: 'warning' }
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Resumen de {formatMonth(toMonthString({ month, year }))}
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!loading && unreadAlerts.length > 0 && (
        <section className="mb-6 space-y-2" aria-label="Alertas sin leer">
          {unreadAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                alert.type === 'danger'
                  ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
              }`}
            >
              <BellRing
                size={18}
                aria-hidden="true"
                className={`mt-0.5 shrink-0 ${
                  alert.type === 'danger' ? 'text-red-600' : 'text-amber-600'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{alert.message}</p>
                <Link
                  to="/alertas"
                  className="mt-1 inline-block text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Ver todas las alertas
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map(({ label, value, icon: Icon, tone }) => (
              <StatCard key={label} label={label} value={value} icon={Icon} tone={tone} />
            ))}
          </section>

          <section className="mb-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
                Evolución mensual
              </h2>
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolutionData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      tickFormatter={(value) => `${Math.round(value / 100) / 10}k`}
                    />
                    <Tooltip
                      formatter={(value) => formatAmount(value)}
                      contentStyle={tooltipStyle}
                      cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
                    />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

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
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={categoryColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatAmount(value)} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Total gastado
                    </p>
                    <p className="amount text-lg font-bold text-slate-900 dark:text-white">
                      {formatAmount(totalExpense)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Gastos por categoría</h2>
            {Object.keys(expensesByCategory).length === 0 ? (
              <EmptyState icon={PieChartIcon} title="Sin gastos categorizados" />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <li key={category} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: categoryColor(category) }}
                        aria-hidden="true"
                      />
                      {category}
                    </span>
                    <span className="amount text-sm font-medium text-red-600">{formatAmount(amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Últimos movimientos</h2>
            {recentTransactions.length === 0 ? (
              <EmptyState icon={ReceiptText} title="Sin movimientos en el período" />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
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
                      className={`amount text-sm font-semibold ${
                        transaction.type === 'income'
                          ? 'text-success-600 dark:text-success-500'
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
