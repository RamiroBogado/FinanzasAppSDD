import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import PropTypes from 'prop-types'
import {
  getToken,
  createCategory,
  deleteCategoryCached,
  getCategories,
  updateCategory
} from '../api.js'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Field from '../components/ui/Field.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../components/ui/ToastProvider.jsx'

const PALETTE = [
  '#6366f1',
  '#8b5cf6',
  '#a78bfa',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f97316'
]

const EMPTY_FORM = {
  name: '',
  type: 'expense',
  color: PALETTE[0]
}

const TypeToggle = ({ type, onChange }) => (
  <div className="flex gap-2">
    {[
      {
        value: 'expense',
        label: 'Gasto',
        active: 'bg-red-50 text-red-600',
        inactive: 'bg-white border border-[#E2E8F0]'
      },
      {
        value: 'income',
        label: 'Ingreso',
        active: 'bg-green-50 text-green-600',
        inactive: 'bg-white border border-[#E2E8F0]'
      }
    ].map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          type === option.value ? option.active : option.inactive
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
)

TypeToggle.propTypes = {
  type: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

const CategoryCard = ({ category, onEdit, onDelete }) => (
  <div className="group flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 transition-colors hover:bg-[#F8FAFC] dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60">
    <span
      className="h-3 w-3 shrink-0 rounded-full"
      style={{ backgroundColor: category.color }}
    />

    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-[#171d19] dark:text-white">
        {category.name}

        <span
          className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            category.type === 'expense'
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-600'
          }`}
        >
          {category.type === 'expense' ? 'Gasto' : 'Ingreso'}
        </span>
      </p>
    </div>

    <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        onClick={() => onEdit(category)}
        title="Editar categoría"
        className="rounded-md p-1.5 text-[#64748B] transition-colors hover:bg-[#eff5ef] hover:text-[#0e9f6e] dark:hover:bg-slate-700 dark:hover:text-white"
      >
        <Pencil size={15} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onDelete(category)}
        title="Eliminar categoría"
        className="rounded-md p-1.5 text-[#64748B] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  </div>
)

CategoryCard.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}

const CategorySection = ({
  title,
  icon: Icon,
  items,
  emptyText,
  onEdit,
  onDelete
}) => (
  <section className="mb-8">
    <div className="mb-4 flex items-center gap-2">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          Icon === ArrowDownRight
            ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
            : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
        }`}
      >
        <Icon size={15} aria-hidden="true" />
      </span>

      <h2 className="text-base font-semibold text-[#171d19] dark:text-white">
        {title} ({items.length})
      </h2>
    </div>

    {items.length === 0 ? (
      <p className="rounded-xl border border-dashed border-[#E2E8F0] p-4 text-center text-sm text-[#64748B] dark:border-slate-700 dark:text-slate-400">
        {emptyText}
      </p>
    ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )}
  </section>
)

CategorySection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  items: PropTypes.array.isRequired,
  emptyText: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}

const CategoriesPage = () => {
  const token = getToken()
  const toast = useToast()

  const [categories, setCategories] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [validationError, setValidationError] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(() => {
    setLoading(true)

    getCategories(token)
      .then(setCategories)
      .catch((err) => toast.showError(err.message))
      .finally(() => setLoading(false))
  }, [token, toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setValidationError(null)
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setEditingId(category.id)
    setForm({
      name: category.name,
      type: category.type,
      color: category.color
    })
    setValidationError(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const name = form.name.trim()

    if (!name) {
      setValidationError('Ingresá un nombre para la categoría')
      return
    }

    setSaving(true)

    try {
      if (editingId) {
        await updateCategory(token, editingId, {
          name,
          type: form.type,
          color: form.color
        })

        toast.showSuccess('Categoría actualizada')
      } else {
        await createCategory(token, {
          name,
          type: form.type,
          color: form.color
        })

        toast.showSuccess('Categoría creada')
      }

      setModalOpen(false)
      setForm(EMPTY_FORM)
      setValidationError(null)
      refresh()
    } catch (err) {
      toast.showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return

    try {
      await deleteCategoryCached(token, deletingCategory.id)
      toast.showSuccess('Categoría eliminada')
      refresh()
    } catch (err) {
      toast.showError(err.message)
    } finally {
      setDeletingCategory(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171d19] dark:text-white">
            Categorías
          </h1>

          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
            Organizá tus ingresos y gastos con tus propios colores.
          </p>
        </div>

        <Button size="sm" onClick={openCreate}>
          <Plus size={14} aria-hidden="true" />
          Agregar categoría
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            title="Aún no tenés categorías"
            description="Creá tu primera categoría para organizar tus transacciones."
          />
        </div>
      ) : (
        <>
          <CategorySection
            title="Gastos"
            icon={ArrowDownRight}
            items={categories.filter(
              (category) => category.type === 'expense'
            )}
            emptyText="Sin categorías de gasto."
            onEdit={openEdit}
            onDelete={setDeletingCategory}
          />

          <CategorySection
            title="Ingresos"
            icon={ArrowUpRight}
            items={categories.filter(
              (category) => category.type === 'income'
            )}
            emptyText="Sin categorías de ingreso."
            onEdit={openEdit}
            onDelete={setDeletingCategory}
          />
        </>
      )}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <DialogTitle className="text-lg font-semibold text-[#171d19] dark:text-white">
              {editingId ? 'Editar categoría' : 'Nueva categoría'}
            </DialogTitle>

            <div className="mt-4 space-y-4">
              <Field label="Tipo">
                <TypeToggle
                  type={form.type}
                  onChange={(type) =>
                    setForm((current) => ({
                      ...current,
                      type
                    }))
                  }
                />
              </Field>

              <Field label="Nombre">
                <Input
                  name="name"
                  type="text"
                  maxLength={32}
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder="Ej: Comida, Sueldo..."
                  autoFocus
                />
              </Field>

              <Field label="Color">
                <div className="grid grid-cols-5 gap-2">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          color
                        }))
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                        form.color === color
                          ? 'border-[#0e9f6e]'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                      aria-label={`Color ${color}`}
                    >
                      {form.color === color && (
                        <Check
                          size={16}
                          className="text-white"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {validationError && (
              <p
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400"
                role="alert"
              >
                {validationError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>

              <Button onClick={handleSubmit} disabled={saving}>
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        title="¿Eliminar esta categoría?"
        description="No se puede eliminar una categoría que esté en uso en transacciones o presupuestos."
        onCancel={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default CategoriesPage