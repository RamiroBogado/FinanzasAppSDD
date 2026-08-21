# Proposal: savings-goals

## Why

El producto define entre sus funcionalidades iniciales las metas de ahorro y son la última capability financiera core faltante: hoy el usuario puede registrar transacciones, categorías y presupuestos, pero no puede fijar objetivos de ahorro ni seguir cuánto llevá acumulado hacia cada uno.

## What Changes

- Nueva tabla `goals` en SQLite (nombre, monto objetivo, monto ahorrado, fecha límite opcional) con aislamiento por usuario.
- API REST `/api/goals` con CRUD completo protegido por JWT: creación (201), listado propio ordenado por creación descendente, consulta, actualización y eliminación (204), con validaciones 400 en español y 404 sin revelar datos ajenos.
- Acceso `Metas` en la barra lateral con página dedicada: formulario de alta/edición, tarjetas con progreso visual (barra y badge `¡Meta cumplida!`), chip de fecha límite con estado vencido y acciones `Aportar`, `Retirar`, `Editar` y `Eliminar`.
- Diálogo reutilizable de montos para aportar o retirar dinero de una meta; el retiro nunca deja el ahorrado por debajo de cero.
- Feedback consistente con el sistema de diseño vigente: toasts (`Meta creada`, `Meta actualizada`, `Meta eliminada`, `Aporte registrado`, `Retiro registrado`), confirmación al eliminar, skeletons y estado vacío `Aún no tenés metas de ahorro`.
- Sin dependencias nuevas; reutiliza los patrones de presupuestos.

## Capabilities

### New Capabilities
- `goals`: gestión de metas de ahorro propias (CRUD API protegido por JWT con montos en centavos y deadline ISO opcional) e interfaz para crearlas, editarlas, eliminarlas, aportarles y retirarles dinero con progreso visual.

### Modified Capabilities

## Impact

- **Código**: `backend/src/schema.js` (tabla + índice + alters), nuevo `backend/src/goals.js`, `backend/src/routes/goals.js`, montaje en `backend/src/app.js`, tests en `backend/test/goals.test.js`; frontend: `src/api.js`, `src/components/AppLayout.jsx`, `src/main.jsx`, nueva `src/components/ui/AmountDialog.jsx` y nueva `src/pages/GoalPage.jsx`.
- **Dependencias**: ninguna nueva.
- **API**: nuevos endpoints `/api/goals`; sin cambios en endpoints existentes.
- **Verificación**: backend lint+test, frontend lint+build, docker compose con validación HTTP E2E de dos usuarios y revisión UI.
