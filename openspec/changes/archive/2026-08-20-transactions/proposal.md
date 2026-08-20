## Why

La autenticación ya permite identificar al usuario, pero la aplicación todavía no puede registrar ningún dato financiero. Sin un registro de ingresos y gastos no existe contenido para gestionar ni base para las funcionalidades futuras (categorías, presupuestos, dashboard, IA), todas dependientes del historial de transacciones.

## What Changes

- Backend: nueva tabla `transactions` (schema SQLite) con aislamiento por usuario, y endpoints REST protegidos con JWT para crear, listar (con filtro opcional por tipo), consultar, editar y eliminar transacciones propias.
- Transacciones: cada transacción tiene tipo (`income` o `expense`), monto, fecha (ISO `YYYY-MM-DD`) y descripción opcional. Los montos se almacenan en centavos (entero) para evitar errores de punto flotante.
- Frontend: la vista protegida `/app` pasa de ser un placeholder a la gestión de transacciones: alta con formulario (tipo, monto, fecha, descripción), listado con totales por tipo y acciones de edición y eliminación, con textos en español y formatos de fecha y monto reutilizables.
- Ningún cambio es **BREAKING**; se agrega el primer recurso financiero sobre la tabla `users` existente.
- No se incluyen categorías, presupuestos, dashboard ni exportaciones: son changes separados.

## Capabilities

### New Capabilities
- `transactions`: gestión de ingresos y gastos propios de cada usuario, con aislamiento total por usuario autenticado, incluyendo creación, listado, consulta, actualización y eliminación.

### Modified Capabilities
- Ninguna.

## Impact

- Backend: schema SQLite nuevo (tabla `transactions` mediante `CREATE TABLE IF NOT EXISTS` y bloque de `ALTER` guiado por `PRAGMA table_info` para bases existentes), nuevas rutas bajo `/api/transactions/*` protegidas con `requireAuth`, y helpers de acceso a datos que filtran siempre por el usuario autenticado. Sin dependencias nuevas.
- Frontend: helper de API ampliado (métodos de transacciones), helpers reutilizables de formato de fecha (dd/mm/yyyy) y monto (ARS), y la página `/app` reconstruida como gestión de transacciones. Se conserva la integración mediante el proxy Vite ya existente.
- ai: sin modificaciones.
- Verificación por capa: `npm run lint` + `npm test` en `backend/`; `npm run lint` + `npm run build` en `frontend/`; arranque unificado `docker compose up -d --build app` con validación del flujo de transacciones en la UI (alta, listado, edición, eliminación y aislamiento entre dos usuarios).