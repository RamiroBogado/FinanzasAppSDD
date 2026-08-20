## Context

El backend expone solo `/health` y `/api/auth/*`: existe `requireAuth` que resuelve `req.userId` del JWT, y `schema.js` inicializa tablas de forma idempotente (`CREATE TABLE IF NOT EXISTS` + bloque `ALTER` guiado por `PRAGMA table_info` para bases existentes). El frontend tiene el API helper con `Authorization: Bearer` y la vista protegida `/app` es solo un placeholder que muestra el username y `Cerrar sesión`. Motivación y alcance en `proposal.md`; comportamiento exigido en `specs/transactions/spec.md`.

## Goals / Non-Goals

**Goals:**
- Tabla SQLite `transactions` idempotente (bases nuevas y existentes) con aislamiento por `user_id`.
- CRUD REST protegido por JWT bajo `/api/transactions`, donde toda query filtra por `req.userId`.
- Montos sin errores de punto flotante, fechas ISO `YYYY-MM-DD`, errores en español.
- Frontend: gestión completa de transacciones en `/app` con formatos de moneda ARS y fecha `dd/mm/aaaa` reutilizables.

**Non-Goals:**
- Categorías, presupuestos, metas, dashboard y exportaciones (changes separados).
- Búsqueda por monto con formatos `15.000`/`1.500,00` (requerido por un change futuro de búsqueda).
- Selección o conversión de monedas (ARS única por ahora; sin columna `currency` que ya esté definida).
- Cambios en el servicio `ai/` ni en `docker-compose.yml` (no hay env vars nuevas).

## Decisions

**1. Una sola tabla `transactions` con columna `type`**
Columnas: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `user_id INTEGER NOT NULL` (FK → `users.id`), `type TEXT NOT NULL CHECK (type IN ('income','expense'))`, `amount INTEGER NOT NULL`, `date TEXT NOT NULL` (ISO `YYYY-MM-DD`), `description TEXT`, `created_at TEXT NOT NULL`. Alternativa: dos tablas (`incomes` y `expenses`) — se descarta: duplica estructura y complica listados/totales combinados con uniones; el contexto trata ingresos y gastos como flujos del mismo recurso financiero.

**2. Monto en centavos como INTEGER**
El campo `amount` de la API es un entero positivo en centavos de ARS; la UI convierte pesos con hasta 2 decimales ⇄ centavos. Alternativas: `REAL` (riesgo de errores de punto flotante en sumas), `TEXT` con parseo (indirecto). Se elige INTEGER porque las sumas/totales son exactas y el formato requiere dos decimales.

**3. Rutas REST bajo `/api/transactions` protegidas con `requireAuth`**
- `POST /api/transactions`: valida `type` (`income`/`expense`), `amount` (entero positivo), `date` (ISO `YYYY-MM-DD` o default fecha actual) y `description` (opcional, ≤ 255 chars); responde 201 con la transacción creada.
- `GET /api/transactions`: lista propias ordenadas por `date DESC, id DESC`; filtro opcional `?type=income|expense`.
- `GET /api/transactions/:id`: responde 404 `Transacción no encontrada` si no existe o es de otro usuario (misma respuesta para no filtrar existencia).
- `PUT /api/transactions/:id`: mismas validaciones que POST; cambia solo campos propios; 404 ante id ajeno/inexistente; nunca altera `user_id`.
- `DELETE /api/transactions/:id`: 204 propio; 404 ajeno/inexistente.
- Errores 400 en español: tipo inválido, monto no entero positivo, fecha malformada, descripción demasiado larga.

**4. Helpers de acceso a datos en `backend/src/transactions.js`**
Centraliza las queries (patrón de `users.js`) con `WHERE user_id = ?` en todas; el router solo orquesta validación y respuestas. La consulta por id de usuario: `SELECT ... WHERE id = ? AND user_id = ?` → `undefined` equivale a 404.

**5. Extensión del schema sin romper bases existentes**
`CREATE TABLE IF NOT EXISTS transactions` cubre instalaciones nuevas; el bloque guiado por `PRAGMA table_info` (patrón usado con `users`) prepara la tabla y columnas faltantes en bases existentes con `ALTER TABLE` cuando corresponda. No hay migraciones externas.

**6. Frontend: helpers y vista `/app`**
- `frontend/src/format.js`: `formatAmount(cents)` → `$ 1.234,56` (ARS, separador de miles, dos decimales) y `formatDate(date)` → `dd/mm/aaaa`; helpers reutilizables exigidos por el contexto.
- `api.js`: `listTransactions(token, type?)`, `createTransaction(token, payload)`, `updateTransaction(token, id, payload)`, `deleteTransaction(token, id)`.
- `AppPage.jsx` deja de ser placeholder: formulario de alta (select tipo con `Ingreso`/`Gasto`, monto, fecha, descripción, botón `Agregar transacción`), totales (ingresos, gastos, saldo) y listado con acciones `Editar`/`Eliminar`; edición reusando el formulario con `Guardar cambios`/`Cancelar`. Conserva el username y `Cerrar sesión`. Integración vía el proxy Vite ya configurado (`/api/transactions` → backend:3001).

**7. Índice para el listado por usuario**
Índice `CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date DESC)` para que el listado/filtro por usuario y fecha no escale con la tabla completa.

## Risks / Trade-offs

- [Monto en centavos: la API expone enteros, menos legible para consumidores externos] → Mitigación: la UI es el único consumidor actual y traduce a formato ARS; documentado en spec (`amount` entero de centavos).
- [CHECK constraint en `type` es menos flexible para agregar tipos futuros] → Mitigación: si un change futuro agrega tipos, el bloque `ALTER`/nueva CHECK lo gestiona explícitamente; el código valida también el valor recibido.
- [La omisión de `date` usa la fecha del servidor, que puede diferir de la del cliente] → Mitigación: comportamiento declarado en spec; la UI siempre envía la fecha elegida.
- [Crear índice explícito duplica trabajo de SQLite] → Mitigación: índice acotado a `(user_id, date)`; costo de escritura despreciable frente a la ganancia de lectura del listado.

## Migration Plan

- Bases nuevas: `CREATE TABLE IF NOT EXISTS transactions` se ejecuta al arrancar con el resto del schema.
- Bases existentes: el bloque guiado por `PRAGMA table_info` crea la tabla si falta; no hay columnas nuevas sobre tabla existente en este change.
- Rollback: retirar rutas y helpers; la tabla `transactions` puede permanecer sin afectar al resto del sistema.

## Open Questions

- Ninguna: las decisiones pendientes de alcance se resolvieron en el plan aprobado (tabla única, centavos, CRUD + filtro por tipo, búsqueda por monto fuera de alcance).