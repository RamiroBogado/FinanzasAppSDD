## Why

Las transacciones ya se registran, pero sin ningún ordenamiento temático: un usuario no puede distinguir de un vistazo en qué gasta, ni acotar el listado a un período o a una búsqueda. Las categorías y los filtros son la base inmediata de los presupuestos y del dashboard futuros.

## What Changes

- Backend: la transacción gana una categoría opcional (`category`, texto libre hasta 32 caracteres, normalizada a `NULL` si vacía), aceptada en alta y edición, y el listado `GET /api/transactions` suma filtros combinables por categoría (case-insensitive), texto parcial en descripción y rango de fechas inclusive (`from`/`to` ISO), respetando siempre el aislamiento por usuario.
- Frontend: el formulario de `/app` agrega el campo Categoría con un set sugerido (Comida, Transporte, Vivienda, Sueldo, Salud, Entretenimiento, Otros) usando `<datalist>` (texto libre permitido), se agrega una barra de filtros (categoría, texto, desde/hasta, `Limpiar filtros`), los totales de ingresos/gastos/saldo se recalculan sobre el resultado filtrado, y se muestran los gastos por categoría con formato ARS.
- Ningún cambio es **BREAKING**: la columna es aditiva y los filtros son parámetros opcionales.
- Fuera de alcance: gestión CRUD de categorías como entidad, filtro "sin categoría", presupuestos y dashboard (changes separados).

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `transactions`: la creación/edición acepta `category` opcional y el listado acepta filtros combinables (`category`, `q`, `from`, `to`); la interfaz agrega categoría, filtros, totales recalculados sobre el resultado filtrado y gastos por categoría.

## Impact

- Backend: `schema.js` agrega la columna `category` (bases existentes vía bloque `ALTER` guiado por `PRAGMA table_info`), `transactions.js` incorpora los filtros al listado con escape de comodines en `q`, y `routes/transactions.js` valida `category` (≤ 32 chars) y fechas `from`/`to` ISO con error 400 en español. Sin dependencias nuevas.
- Frontend: `api.js` generaliza `listTransactions` con parámetros de filtro, y `AppPage.jsx` incorpora el campo categoría, la barra de filtros, totales sobre resultado filtrado y la sección de gastos por categoría.
- ai: sin modificaciones.
- Verificación por capa: `npm run lint` + `npm test` en `backend/`; `npm run lint` + `npm run build` en `frontend/`; arranque unificado `docker compose up -d --build app` con validación en UI de categorías, filtros y aislamiento entre dos usuarios.