# Proposal: ui-creation-modals

## Why

El modal de `Categorías` con fondo difuminado (`bg-slate-900/50 backdrop-blur-sm`) y card centrada gusta y da consistencia visual. `Transacciones`, `Presupuestos` y `Metas` aún usan formularios inline siempre visibles o con toggle, rompiendo la coherencia del producto. Unificar el patrón mejora la jerarquía, reduce ruido visual y mantiene el foco del usuario en la acción de creación/edición.

## What Changes

- Reemplazar el formulario inline de `Transacciones` (`AppPage.jsx`) por un modal `Dialog` de `@headlessui/react` idéntico al de `Categorías`: fondo `bg-slate-900/50 backdrop-blur-sm`, `DialogPanel` `rounded-xl border bg-white p-6 shadow-xl`, `DialogTitle` dinámico.
- Reemplazar el formulario siempre visible de `Presupuestos` (`BudgetPage.jsx`) por el mismo modal; agregar botón `Agregar presupuesto` verde primary con icono `Plus` en el header (hoy no existe botón de apertura).
- Reemplazar el formulario siempre visible de `Metas` (`GoalPage.jsx`) por el mismo modal; agregar botón `Agregar meta` verde primary con icono `Plus` en el header.
- En los tres casos, tanto creación como edición abren el modal con fondo difuminado; el cierre se hace por `Cancelar`, submit exitoso, click en backdrop o `ESC`.
- Mantener validación, toasts, skeletons, estados vacíos y listados sin cambios.

## Capabilities

### New Capabilities
- (ninguna)

### Modified Capabilities
- `ui`: nuevo patrón transversal de modal de creación/edición con backdrop difuminado.
- `transactions`: la gestión en la interfaz pasa de formulario inline/toggle a modal.
- `budgets`: la gestión en la interfaz pasa de formulario siempre visible a modal con botón de apertura.
- `goals`: la gestión en la interfaz pasa de formulario siempre visible a modal con botón de apertura.

## Impact

- Código afectado: `frontend/src/pages/AppPage.jsx`, `frontend/src/pages/BudgetPage.jsx`, `frontend/src/pages/GoalPage.jsx`.
- Sin cambios de API ni backend.
- Dependencia ya instalada: `@headlessui/react` (`Dialog`, `DialogPanel`, `DialogTitle`).
- Validación: `npm run lint && npm run build` en `frontend/` + smoke manual de apertura/cierre/creación/edición en cada página.
