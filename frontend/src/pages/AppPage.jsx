import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Wallet
} from 'lucide-react'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { api, getToken } from '../api.js'
import { formatAmount, formatDate, formatMonth, toLocalDate } from '../format.js'
import Button from '../components/ui/Button.jsx'
import Input, { Select } from '../components/ui/Input.jsx'
import Field from '../components/ui/Field.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../components/ui/ToastProvider.jsx'
import { periodRange, toMonthString, usePeriod } from '../context/PeriodContext.jsx'

const SUGGESTED_CATEGORIES = [
  'Comida',
  'Transporte',
  'Vivienda',
  'Sueldo',
  'Salud',
  'Entretenimiento',
  'Otros'
]

const EMPTY_FORM = {
  type: 'expense',
  amount: '',
  date: toLocalDate(new Date()),
  description: '',
  category: ''
}

const EMPTY_FILTERS = { category: '', q: '', from: '', to: '' }

const hasActiveFilters = (filters) =>
  Boolean(filters.category || filters.q || filters.from || filters.to)

const SectionTitle = ({ icon: Icon, children }) => (
  <div className="mb-4 flex items-center gap-2">
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff5ef] text-[#0e9f6e] dark:bg-[#0e9f6e]/10 dark:text-[#0e9f6e]">
      <Icon size={15} aria-hidden="true" />
    </span>
    <h2 className="text-base font-semibold text-[#171d19] dark:text-white">{children}</h2>
  </div>
)

const EXPORT_OPTIONS = [
  { format: 'csv', label: 'Exportar CSV', icon: FileText },
  { format: 'pdf', label: 'Exportar PDF', icon: FileText },
  { format: 'xlsx', label: 'Exportar XLSX', icon: FileSpreadsheet }
]

SectionTitle.propTypes = {
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired
}

const AppPage = () => {
  const token = getToken()
  const toast = useToast()
  const { month, year } = usePeriod()
  const [transactions, setTransactions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState(SUGGESTED_CATEGORIES)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const [editingId, setEditingId] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [deletingTransaction, setDeletingTransaction] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const periodRangeValues = periodRange({ month, year })
  const scopedFilters = {
    ...appliedFilters,
    from: appliedFilters.from || periodRangeValues.from,
    to: appliedFilters.to || periodRangeValues.to
  }

  const refresh = useCallback(
    (params) => {
      setLoading(true)
      api
        .listTransactions(token, params)
        .then((data) => {
          setTransactions(data)
          if (!hasActiveFilters(appliedFilters)) {
            setCategoryOptions([
              ...new Set([
                ...SUGGESTED_CATEGORIES,
                ...data.map((transaction) => transaction.category).filter(Boolean)
              ])
            ])
          }
        })
        .catch((err) => toast.showError(err.message))
        .finally(() => setLoading(false))
    },
    [token, toast, appliedFilters]
  )

  useEffect(() => {
    refresh(scopedFilters)
  }, [appliedFilters, month, year, refresh])

  const recheckAlerts = () => {
    api
      .checkAlerts(token)
      .then(() => window.dispatchEvent(new Event('alerts-updated')))
      .catch(() => {})
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    const updated = { ...filters, [name]: value }
    setFilters(updated)

    if (name !== 'q') {
      setAppliedFilters(updated)
    }
  }

  const handleApplySearch = () => {
    setAppliedFilters({ ...filters, q: filters.q })
  }

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  const handleExport = async (format) => {
    setExporting(true)

    try {
      await api.exportTransactions(token, scopedFilters, format)
      toast.showSuccess('Exportación descargada')
    } catch (err) {
      toast.showError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const amount = Math.round(parseFloat(form.amount) * 100)

    if (!Number.isFinite(amount) || amount <= 0) {
      setValidationError('Ingresá un monto válido')
      return
    }

    const payload = {
      type: form.type,
      amount,
      date: form.date,
      description: form.description,
      category: form.category
    }

    try {
      if (editingId) {
        await api.updateTransaction(token, editingId, payload)
        toast.showSuccess('Transacción actualizada')
        setEditingId(null)
      } else {
        await api.createTransaction(token, payload)
        toast.showSuccess('Transacción agregada')
      }
      setForm(EMPTY_FORM)
      setValidationError(null)
      setShowForm(false)
      recheckAlerts()
      refresh(scopedFilters)
    } catch (err) {
      toast.showError(err.message)
    }
  }

  const handleEdit = (transaction) => {
    setEditingId(transaction.id)
    setForm({
      type: transaction.type,
      amount: (transaction.amount / 100).toString(),
      date: transaction.date,
      description: transaction.description ?? '',
      category: transaction.category ?? ''
    })
    setValidationError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setValidationError(null)
    setShowForm(false)
  }

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return

    try {
      await api.deleteTransaction(token, deletingTransaction.id)
      toast.showSuccess('Transacción eliminada')
      recheckAlerts()
      refresh(scopedFilters)
    } catch (err) {
      toast.showError(err.message)
    } finally {
      setDeletingTransaction(null)
    }
  }

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

  const summaryCards = [
    {
      label: 'Ingresos',
      value: formatAmount(totalIncome),
      icon: ArrowUpRight,
      tone: 'success'
    },
    {
      label: 'Gastos',
      value: formatAmount(totalExpense),
      icon: ArrowDownRight,
      tone: 'danger'
    },
    {
      label: 'Balance',
      value: formatAmount(balance),
      icon: Wallet,
      tone: 'brand'
    }
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171d19] dark:text-white">Transacciones</h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
            Registrá tus ingresos y gastos. Estás viendo {formatMonth(toMonthString({ month, year }))}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowForm((v) => !v)} size="sm">
            <Plus size={14} aria-hidden="true" />
            {showForm ? 'Cerrar formulario' : 'Agregar transacción'}
          </Button>
          <Menu as="div" className="relative">
            <MenuButton
              disabled={exporting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0e9f6e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0a7a53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] disabled:pointer-events-none disabled:opacity-50"
            >
              <Download size={14} aria-hidden="true" />
              {exporting ? 'Exportando…' : 'Exportar'}
              {!exporting && <ChevronDown size={14} aria-hidden="true" />}
            </MenuButton>
            <MenuItems
              anchor="bottom end"
              className="z-50 w-44 rounded-lg border border-[#E2E8F0] bg-white p-1 shadow-lg focus:outline-none dark:border-slate-700 dark:bg-slate-900"
            >
              {EXPORT_OPTIONS.map(({ format, label, icon: Icon }) => (
                <MenuItem key={format}>
                  <button
                    type="button"
                    onClick={() => handleExport(format)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#3d4a42] data-[focus]:bg-[#eff5ef] data-[focus]:text-[#0e9f6e] dark:text-slate-200 dark:data-[focus]:bg-slate-800 dark:data-[focus]:text-white"
                  >
                    <Icon size={15} aria-hidden="true" />
                    {label}
                  </button>
                </MenuItem>
              ))}
            </MenuItems>
          </Menu>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map(({ label, value, icon: Icon, tone }) => (
          <StatCard key={label} label={label} value={value} icon={Icon} tone={tone} />
        ))}
      </section>

      <section className="mb-6 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff5ef] text-[#0e9f6e]">
              <Filter size={15} aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-[#171d19] dark:text-white">Filtros</h2>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs font-medium text-[#64748B] hover:text-[#0e9f6e] hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Filtrar por categoría">
            <Select name="category" value={filters.category} onChange={handleFilterChange} className="mt-1">
              <option value="">Todas</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Buscar por descripción">
            <Input
              name="q"
              type="text"
              value={filters.q}
              onChange={handleFilterChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleApplySearch()
              }}
              onBlur={handleApplySearch}
              placeholder="Buscar por descripción"
              className="mt-1"
            />
          </Field>
          <Field label="Desde">
            <Input name="from" type="date" value={filters.from} onChange={handleFilterChange} className="mt-1" />
          </Field>
          <Field label="Hasta">
            <Input name="to" type="date" value={filters.to} onChange={handleFilterChange} className="mt-1" />
          </Field>
        </div>
      </section>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <SectionTitle icon={editingId ? Filter : Plus}>
            {editingId ? 'Editar transacción' : 'Nueva transacción'}
          </SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select name="type" value={form.type} onChange={handleChange} className="mt-1">
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </Select>
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
            <Field label="Fecha">
              <Input name="date" type="date" value={form.date} onChange={handleChange} className="mt-1" />
            </Field>
            <Field label="Descripción">
              <Input
                name="description"
                type="text"
                maxLength={255}
                value={form.description}
                onChange={handleChange}
                placeholder="Descripción opcional"
                className="mt-1"
              />
            </Field>
            <Field label="Categoría">
              <Input
                name="category"
                type="text"
                maxLength={32}
                list="category-suggestions"
                value={form.category}
                onChange={handleChange}
                placeholder="Categoría opcional"
                className="mt-1"
              />
              <datalist id="category-suggestions">
                {SUGGESTED_CATEGORIES.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </Field>
          </div>
          {validationError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400" role="alert">
              {validationError}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Button type="submit">{editingId ? 'Guardar cambios' : 'Agregar transacción'}</Button>
            <Button variant="secondary" onClick={handleCancelEdit}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff5ef] text-[#0e9f6e]">
              <Filter size={15} aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-[#171d19] dark:text-white">Tus transacciones</h2>
            <span className="ml-auto text-xs text-[#64748B]">{transactions.length} movimientos</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-14" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title={hasActiveFilters(appliedFilters) ? 'Sin resultados con los filtros actuales' : 'Sin transacciones en este período'}
              description={hasActiveFilters(appliedFilters) ? undefined : 'Agregá la primera desde el botón Agregar transacción.'}
            >
              {hasActiveFilters(appliedFilters) && (
                <Button variant="secondary" size="sm" className="mt-3" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
              {transactions.map((transaction) => {
                const isIncome = transaction.type === 'income'

                return (
                  <li
                    key={transaction.id}
                    className="group flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isIncome
                            ? 'bg-[#e6f4ef] text-[#0e9f6e] dark:bg-green-500/10 dark:text-green-400'
                            : 'bg-[#ffe4e6] text-[#E11D48] dark:bg-red-500/10 dark:text-red-400'
                        }`}
                      >
                        {isIncome ? <ArrowUpRight size={16} aria-hidden="true" /> : <ArrowDownRight size={16} aria-hidden="true" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#171d19] dark:text-slate-100">
                          {transaction.description || (isIncome ? 'Ingreso' : 'Gasto')}
                          {transaction.category && (
                            <span className="ml-2 inline-block max-w-[8rem] truncate rounded-full bg-[#eff5ef] px-2 py-0.5 align-middle text-xs font-medium text-[#0e9f6e] dark:bg-[#0e9f6e]/10 dark:text-[#0e9f6e]">
                              {transaction.category}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[#64748B] dark:text-slate-400">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        className={`amount mr-2 whitespace-nowrap text-sm font-semibold ${isIncome ? 'text-[#0e9f6e] dark:text-green-400' : 'text-[#E11D48]'}`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatAmount(transaction.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEdit(transaction)}
                        className="hidden rounded-md px-2 py-1 text-xs font-medium text-[#64748B] hover:bg-[#eff5ef] hover:text-[#0e9f6e] group-hover:inline-flex dark:text-slate-400"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTransaction(transaction)}
                        className="hidden rounded-md px-2 py-1 text-xs font-medium text-[#64748B] hover:bg-[#ffe4e6] hover:text-[#E11D48] group-hover:inline-flex dark:text-slate-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="h-fit rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff5ef] text-[#0e9f6e]">
              <Wallet size={15} aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-[#171d19] dark:text-white">Gastos por categoría</h2>
          </div>
          {Object.keys(expensesByCategory).length === 0 ? (
            <p className="py-6 text-center text-sm text-[#64748B]">Sin gastos categorizados</p>
          ) : (
            <ul className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
              {Object.entries(expensesByCategory).map(([category, amount]) => (
                <li key={category} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-[#3d4a42] dark:text-slate-300">{category}</span>
                  <span className="amount whitespace-nowrap text-sm font-semibold text-[#E11D48]">{formatAmount(amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deletingTransaction)}
        title="¿Eliminar esta transacción?"
        description="Esta acción no se puede deshacer."
        onCancel={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default AppPage
