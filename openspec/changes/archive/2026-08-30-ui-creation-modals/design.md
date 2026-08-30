## Context

Actualmente `CategoriesPage.jsx` usa `Dialog` + `DialogPanel` de `@headlessui/react` con `fixed inset-0 bg-slate-900/50 backdrop-blur-sm` y card `rounded-xl border bg-white p-6 shadow-xl`. `AppPage.jsx` usa un formulario inline con toggle `showForm` y `scrollTo`, mientras `BudgetPage.jsx` y `GoalPage.jsx` muestran el formulario siempre visible arriba del listado. La inconsistencia rompe la jerarquía visual. La dependencia `@headlessui/react` ya está instalada; no hay cambios de API ni de schema SQLite. Ver `proposal.md` para motivación.

## Goals / Non-Goals

**Goals:**
- Unificar creación y edición de transacciones, presupuestos y metas en el mismo patrón modal con fondo difuminado de categorías.
- Introducir los botones faltantes `Agregar presupuesto` y `Agregar meta` con estilo verde primary e icono `Plus`.
- Mantener validación, toasts, skeletons y estados vacíos sin cambios.

**Non-Goals:**
- Extraer un componente `FormDialog` genérico (se duplica el patrón literal para minimizar riesgo).
- Cambios de backend, schema o API.
- Rediseño visual más allá del modal.

## Decisions

- **Replicar markup literal de Categorías vs. componente genérico.** Categorías ya es la referencia validada con el usuario; copiar su `Dialog` evita divergencias de props y mantiene diffs pequeños. Alternativa descartada: `FormDialog` compartido — añade abstracción prematura para solo 3 usos.
- **Estado `modalOpen` + `editingId` por página.** Sigue el patrón de Categorías (`modalOpen`, `editingId`, `form`, `validationError`). En `AppPage` reemplaza `showForm`; en `BudgetPage`/`GoalPage` añade `modalOpen` donde no existía. Alternativa: reutilizar `showForm` — descartada por semántica distinta (show vs. open) y por necesitar `onClose` de `Dialog`.
- **Mes de presupuesto sigue gobernado por `PeriodContext`.** El modal muestra el mes como `Input type=month disabled` (ya es así en el form inline), no se hace editable dentro del modal. Alternativa: hacer el mes editable — descartada porque el período global es la fuente de verdad del listado.
- **Cierre por `onClose`, backdrop y `ESC` delegado a `Dialog`.** `@headlessui/react` ya maneja foco y `ESC`; no se añade lógica manual. Alternativa: handler propio — innecesario.

## Risks / Trade-offs

- [Modal tapa el listado durante la edición] → Mitigación: el listado permanece detrás del backdrop difuminado; al cerrar se ve el resultado inmediato y los toasts confirman la acción.
- [Duplicación de markup de modal en 3 páginas] → Mitigación: cambio acotado y reversible; extracción a componente compartido queda como follow-up si se añade un cuarto uso.
- [Regresión de validación al mover el form al modal] → Mitigación: no se toca lógica de `handleSubmit`/`validate`; solo cambia el contenedor. Verificación con `npm run lint && npm run build` + smoke manual.

## Migration Plan

- Cambio solo frontend, sin migración de datos. Deploy: `docker compose build --no-cache app && docker compose up -d app`. Rollback: revertir los 3 archivos de página.

## Open Questions

- Ninguna.
