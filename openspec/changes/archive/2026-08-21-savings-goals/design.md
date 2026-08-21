# Design: savings-goals

## Context

El backend ya tiene el patrón completo de recursos en `budgets` (schema con `ensureTable` + alters, helper de consultas, router Express con `requireAuth`, suite Vitest sobre SQLite `:memory:`) y el frontend tiene el sistema de diseño `ui/` con primitivas, toasts, confirmación y skeletons. Este change replica ese patrón para metas de ahorro. Ver proposal.md para la motivación y specs/goals para el contrato.

## Goals / Non-Goals

**Goals**
- CRUD de metas propio con aislamiento por usuario y montos en centavos.
- Interfaz consistente con el sistema de diseño: progreso visual, aportes/retiros y feedback por toasts.

**Non-Goals**
- Historial de aportaciones (la decisión del usuario fue monto directo + acciones).
- Integración de metas en el dashboard o en el chatbot.
- Notificaciones o recordatorios por fecha límite.

## Decisions

1. **Claves JSON camelCase (`targetAmount`, `savedAmount`).** Primer recurso con campos multi-palabra; se elige camelCase por convención JavaScript en frontend y backend (las columnas SQLite mantienen snake_case `target_amount`/`saved_amount` y el mapper `toPublicGoal` hace la traducción). Alternativa descartada: claves de una sola palabra (`target`) por ambigüedad futura.
2. **Monto directo en lugar de libro de aportaciones.** Decisión del usuario: `saved_amount` es un campo editable; `Aportar`/`Retirar` son PUTs que recalculan el valor en cliente reutilizando las validaciones de actualización. Evita una tabla extra y endpoints dedicados en v1.
3. **Retiro sin saldo negativo.** El backend valida `savedAmount >= 0` (400 en español si no); el cliente además valida contra el ahorrado visible antes de enviar. No hay constraint CHECK en SQLite para permitir alters futuros sin riesgo; la validación vive en la ruta.
4. **Sin unicidad de nombre.** A diferencia de presupuestos (única categoría/mes), dos metas pueden llamarse igual; no aplica `UNIQUE`.
5. **Orden del listado: `created_at DESC, id DESC`.** Las más recientes primero, estable ante creaciones en el mismo segundo.
6. **Deadline nullable sin filtro.** Se guarda ISO `YYYY-MM-DD` o NULL; el orden no considera deadline en v1. La UI marca vencida cuando `deadline < hoy` comparando strings ISO (seguro por formato fijo).
7. **Progreso en cliente.** El API devuelve solo datos crudos; el porcentaje y los estados (cumplida, cerca de cumplir, vencida) se calculan en `GoalPage` como ya hace presupuestos con `spent`. Barra indigo, ámbar desde 80% y verde al llegar al 100%, replicando la escala de presupuestos.
8. **Primitiva `ui/AmountDialog.jsx`.** Diálogo genérico (título, etiqueta de monto, texto del botón de acción) usado dos veces en `GoalPage`; convierte pesos a centavos con la misma fórmula de los formularios existentes (`Math.round(parseFloat * 100)`). Validación de retiro mayor al ahorrado dentro del diálogo con mensaje en español.
9. **Navegación e icono.** Acceso `Metas` con icono `Target` de lucide entre `Presupuestos`; ruta `/metas` protegida dentro del layout existente. El label respeta el límite de la sidebar colapsada (title nativo ya implementado).

## Risks / Trade-offs

- [Aporte/retiro concurrente pisa saved_amount] → riesgo aceptado en app single-user por sesión; el PUT es atómico por fila en SQLite.
- [camelCase rompe consistencia percibida] → documentado aquí y en la spec `goals`; los recursos anteriores tienen claves de una palabra y no cambian.
- [Regresión en navegación existente] → el cambio en `AppLayout` es solo agregar un item al array NAV_ITEMS.

## Migration Plan

Rama `feature/savings-goals`; backend con tests antes de frontend; verificación docker E2E de dos usuarios antes de la revisión UI. Rollback borrando la rama; `master` permanece en `83a2365`.

## Open Questions

Ninguna.
