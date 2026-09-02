import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Plus, Target } from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { api, getToken } from '../api.js'
import { formatAmount, formatDate } from '../format.js'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Field from '../components/ui/Field.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import AmountDialog from '../components/ui/AmountDialog.jsx'
import { useToast } from '../components/ui/ToastProvider.jsx'

const EMPTY_FORM = { name: '', targetAmount: '', deadline: '' }

const todayIso = () => new Date().toISOString().slice(0, 10)

const GoalPage = () => {
  const token = getToken()
  const toast = useToast()
  const [goals, setGoals] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingGoal, setEditingGoal] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingGoal, setDeletingGoal] = useState(null)
  const [contributingGoal, setContributingGoal] = useState(null)
  const [withdrawingGoal, setWithdrawingGoal] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    api
      .listGoals(token)
      .then(setGoals)
      .catch((err) => toast.showError(err.message))
      .finally(() => setLoading(false))
  }, [token, toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openCreate = () => {
    setEditingGoal(null)
    setForm(EMPTY_FORM)
    setValidationError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setValidationError(null)
    setEditingGoal(null)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async () => {
    const targetAmount = Math.round(parseFloat(form.targetAmount) * 100)

    if (!form.name.trim()) {
      setValidationError('Ingresá un nombre para la meta')
      return
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setValidationError('Ingresá un monto objetivo válido')
      return
    }

    const payload = {
      name: form.name.trim(),
      targetAmount,
      deadline: form.deadline || null
    }

    try {
      if (editingGoal) {
        await api.updateGoal(token, editingGoal.id, {
          ...payload,
          savedAmount: editingGoal.savedAmount
        })
        toast.showSuccess('Meta actualizada')
        setEditingGoal(null)
      } else {
        await api.createGoal(token, payload)
        toast.showSuccess('Meta creada')
      }
      setModalOpen(false)
      setForm(EMPTY_FORM)
      setValidationError(null)
      setEditingGoal(null)
      refresh()
    } catch (err) {
      toast.showError(err.message)
    }
  }

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setForm({
      name: goal.name,
      targetAmount: (goal.targetAmount / 100).toString(),
      deadline: goal.deadline ?? ''
    })
    setValidationError(null)
    setModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingGoal) return

    try {
      await api.deleteGoal(token, deletingGoal.id)
      toast.showSuccess('Meta eliminada')
      refresh()
    } catch (err) {
      toast.showError(err.message)
    } finally {
      setDeletingGoal(null)
    }
  }

  const applyMovement = async (goal, delta, movementType) => {
    try {
      const updatedGoal = await api.adjustGoal(token, goal.id, movementType, delta)
      
      setGoals(goals.map(g => g.id === goal.id ? updatedGoal : g))
      
      if (movementType === 'contribute') {
        toast.showSuccess(updatedGoal.savedAmount >= updatedGoal.targetAmount ? '¡Meta cumplida!' : 'Aporte registrado')
      } else {
        toast.showSuccess('Retiro registrado')
      }
    } catch (err) {
      toast.showError(err.message)
    }
  }

  const handleContribute = async (cents) => {
    if (!contributingGoal) return

    await applyMovement(contributingGoal, cents, 'contribute')
    setContributingGoal(null)
  }

  const handleWithdraw = async (cents) => {
    if (!withdrawingGoal) return

    await applyMovement(withdrawingGoal, cents, 'withdraw')
    setWithdrawingGoal(null)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171d19] dark:text-white">Metas de ahorro</h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
            Definí objetivos de ahorro, aportá dinero y seguí tu progreso.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} aria-hidden="true" />
          Agregar meta
        </Button>
      </div>

      <Dialog open={modalOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <DialogTitle className="text-lg font-semibold text-[#171d19] dark:text-white">
              {editingGoal ? 'Editar meta' : 'Nueva meta'}
            </DialogTitle>
            <div className="mt-4 space-y-4">
              <Field label="Nombre">
                <Input
                  name="name"
                  type="text"
                  maxLength={80}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Vacaciones"
                />
              </Field>
              <Field label="Monto objetivo">
                <Input
                  name="targetAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.targetAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Fecha límite (opcional)">
                <Input
                  name="deadline"
                  type="date"
                  min={todayIso()}
                  value={form.deadline}
                  onChange={handleChange}
                />
              </Field>
            </div>
            {validationError && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400" role="alert">
                {validationError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={closeModal}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>{editingGoal ? 'Guardar cambios' : 'Agregar meta'}</Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-semibold text-[#171d19] dark:text-white">Tus metas</h2>
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Aún no tenés metas de ahorro"
            description="Creá tu primera meta desde el formulario de arriba."
          />
        ) : (
          <ul className="-mx-2 divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {goals.map((goal) => {
              const completed = goal.savedAmount >= goal.targetAmount
              const percentage = Math.min(
                100,
                Math.round((goal.savedAmount / goal.targetAmount) * 100)
              )
              const overdue = Boolean(goal.deadline) && !completed && goal.deadline < todayIso()

              return (
                <li
                  key={goal.id}
                  className="group rounded-lg px-2 py-4 transition-colors hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          completed
                            ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                            : 'bg-[#eff5ef] text-[#0e9f6e] dark:bg-[#0e9f6e]/10 dark:text-[#0e9f6e]'
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 size={16} aria-hidden="true" />
                        ) : (
                          <Target size={16} aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#171d19] dark:text-slate-100">
                          {goal.name}
                          {completed && (
                            <span className="ml-2 inline-block rounded-full bg-green-50 px-2 py-0.5 align-middle text-xs font-semibold text-green-600 dark:bg-green-500/10 dark:text-green-400">
                              ¡Meta cumplida!
                            </span>
                          )}
                          {overdue && (
                            <span className="ml-2 inline-block rounded-full bg-red-50 px-2 py-0.5 align-middle text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                              Vencida
                            </span>
                          )}
                        </p>
                        <p className="amount text-xs text-[#64748B] dark:text-slate-400">
                          {formatAmount(goal.savedAmount)} de {formatAmount(goal.targetAmount)}
                          {goal.deadline && !overdue && !completed && (
                            <> · vence {formatDate(goal.deadline)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          completed
                            ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {percentage}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEdit(goal)}
                        className="rounded-md px-2 py-1 text-sm font-medium text-[#64748B] opacity-100 transition-all hover:bg-slate-100 hover:text-[#0e9f6e] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] group-hover:opacity-100 sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-[#0e9f6e]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingGoal(goal)}
                        className="rounded-md px-2 py-1 text-sm font-medium text-[#64748B] opacity-100 transition-all hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 group-hover:opacity-100 sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-2 rounded-full transition-[width] duration-500 ${
                        completed ? 'bg-green-500' : 'bg-[#0e9f6e]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={completed}
                      onClick={() => setContributingGoal(goal)}
                    >
                      Aportar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={goal.savedAmount === 0}
                      onClick={() => setWithdrawingGoal(goal)}
                    >
                      Retirar
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <AmountDialog
        open={Boolean(contributingGoal)}
        title={`Aportar a ${contributingGoal?.name ?? ''}`}
        description={`Falta ${formatAmount(
          contributingGoal ? contributingGoal.targetAmount - contributingGoal.savedAmount : 0
        )} para cumplir la meta.`}
        confirmLabel="Aportar"
        maxAmount={contributingGoal ? contributingGoal.targetAmount - contributingGoal.savedAmount : 0}
        onCancel={() => setContributingGoal(null)}
        onConfirm={handleContribute}
      />
      <AmountDialog
        open={Boolean(withdrawingGoal)}
        title={`Retirar de ${withdrawingGoal?.name ?? ''}`}
        description={`Disponible para retirar: ${
          withdrawingGoal ? formatAmount(withdrawingGoal.savedAmount) : formatAmount(0)
        }`}
        confirmLabel="Retirar"
        danger
        maxAmount={withdrawingGoal ? withdrawingGoal.savedAmount : 0}
        onCancel={() => setWithdrawingGoal(null)}
        onConfirm={handleWithdraw}
      />

      <ConfirmDialog
        open={Boolean(deletingGoal)}
        title="¿Eliminar esta meta?"
        description="Esta acción no se puede deshacer."
        onCancel={() => setDeletingGoal(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default GoalPage
