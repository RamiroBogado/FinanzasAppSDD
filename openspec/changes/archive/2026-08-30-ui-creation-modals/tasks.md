## 1. Transacciones — modal de creación y edición (AppPage)

- [x] 1.1 Importar `Dialog`, `DialogPanel`, `DialogTitle` de `@headlessui/react` en `frontend/src/pages/AppPage.jsx`
- [x] 1.2 Reemplazar el estado `showForm` por `modalOpen` y agregar helpers `openCreate`, `openEdit(transaction)` y `closeModal` (resetean `form`, `editingId`, `validationError`); cambiar el botón del header a `Agregar transacción` verde primary con icono `Plus` que abre el modal (ambos flujos: creación y edición)
- [x] 1.3 Mover el formulario de transacción inline (`showForm && <form>`) dentro de un `Dialog` con fondo `fixed inset-0 bg-slate-900/50 backdrop-blur-sm` y `DialogPanel` `w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900` idéntico a `CategoriesPage.jsx`; `DialogTitle` dinámico `Nueva transacción` / `Editar transacción`; `onClose` cierra por backdrop/`ESC` vía `closeModal`; `handleSubmit` y `handleCancelEdit` cierran el modal en éxito/cancelar y refrescan el listado

## 2. Presupuestos — modal de creación y edición (BudgetPage)

- [x] 2.1 Importar `Dialog`, `DialogPanel`, `DialogTitle` de `@headlessui/react` en `frontend/src/pages/BudgetPage.jsx`
- [x] 2.2 Agregar estado `modalOpen` y helpers `openCreate` / `openEdit(budget)` / `closeModal`; agregar botón `Agregar presupuesto` verde primary con icono `Plus` junto al `PageHeader` que abre el modal en modo creación
- [x] 2.3 Mover el formulario de presupuesto (categoría, monto, umbral, mes deshabilitado) dentro del mismo `Dialog`/`backdrop-blur`/`DialogPanel` de categorías; `DialogTitle` `Nuevo presupuesto` / `Editar presupuesto`; `onClose` y `handleSubmit`/`handleCancelEdit` cierran el modal y refrescan `refresh(selectedMonth)`

## 3. Metas — modal de creación y edición (GoalPage)

- [x] 3.1 Importar `Dialog`, `DialogPanel`, `DialogTitle` de `@headlessui/react` en `frontend/src/pages/GoalPage.jsx`
- [x] 3.2 Agregar estado `modalOpen` y helpers `openCreate` / `openEdit(goal)` / `closeModal`; agregar botón `Agregar meta` verde primary con icono `Plus` en el header que abre el modal en modo creación
- [x] 3.3 Mover el formulario de meta (nombre, monto objetivo, fecha límite) dentro del mismo `Dialog`/`backdrop-blur`/`DialogPanel`; `DialogTitle` `Nueva meta` / `Editar meta`; mantener `AmountDialog` y `ConfirmDialog` existentes sin cambios; `onClose` y `handleSubmit`/`handleCancelEdit` cierran el modal y refrescan el listado

## 4. Verificación

- [x] 4.1 `npm run lint` (0 errores) y `npm run build` (success; warning de chunk >500 kB preexistente aceptable) en `frontend/`
- [x] 4.2 Smoke manual: en Transacciones, Presupuestos y Metas verificar que `Agregar ...` abre el modal con fondo difuminado, que `Editar` abre el mismo modal con datos precargados, y que `Cancelar`, submit exitoso, click en backdrop y `ESC` cierran el modal y actualizan el listado con toasts correspondientes
