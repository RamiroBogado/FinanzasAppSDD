## Context

El backend lista transacciones con `GET /api/transactions` (filtro previo por `type`, orden `date DESC, id DESC`) y valida alta/edición en `routes/transactions.js`; el schema se mantiene idempotente con `CREATE TABLE IF NOT EXISTS` + bloque `ALTER` guiado por `PRAGMA table_info` (patrón `ensureTable` en `schema.js`). El frontend ya reutiliza `format.js`, centraliza llamadas en `api.js` y gestiona transacciones en `AppPage.jsx` con totales y listado. Motivación y alcance en `proposal.md`; comportamiento exigido en `specs/transactions/spec.md`.

## Goals / Non-Goals

**Goals:**
- Categoría opcional por transacción (`category`), persistida y validada (≤ 32 chars), aceptada en alta y edición.
- Filtros combinables en el listado: categoría (case-insensitive), texto parcial en descripción, rango de fechas inclusive — siempre acotados a `user_id`.
- UI: campo categoría con set sugerido, barra de filtros, totales sobre el resultado filtrado y gastos por categoría.

**Non-Goals:**
- Gestión CRUD de categorías como entidad (tabla `categories`), filtro "sin categoría" y recuentos por categoría: requirentes de changes separados (presupuestos/dashboard).
- Normalización de sinónimos de categorías (p. ej. "comida" = "Comida"): se normaliza solo a `NULL` cuando llega vacía; la coincidencia del filtro es case-insensitive pero textual.
- Paginación del listado y filtros por monto (con formatos `15.000`/`1.500,00`): cambios futuros.

## Decisions

**1. Categoría como columna `TEXT` opcional en `transactions`, no tabla `categories`**
Sin CRUD de categorías, sin FK y sin datos duplicados por usuario: el set sugerido vive en la UI (`<datalist>` permite libre tipeo). Alternativa: tabla `categories` por usuario con seed — se descarta: agrega superficie (endpoints, UI de gestión) que este change no necesita; los presupuestos futuros pueden introducir la entidad y migrar el texto a un FK.

**2. Filtros en SQL con cláusulas condicionales, manteniendo el patrón de `WHERE user_id = ?`**
`listTransactions(userId, { type, category, q, from, to })` construye WHERE con condiciones según parámetros presentes:
- `category`: `lower(category) = lower(?)`.
- `q`: `lower(description) LIKE lower(?)` con `%` y `_` escapados para tratar el texto como literal.
- `from`/`to`: `date >= ?` / `date <= ?`.
Alternativa: filtrar en memoria — se descarta: no escala y rompe el ordenamiento previo del listado; SQLite ya indexa por `(user_id, date DESC)`.

**3. Validación en el router**
- `category`: si está presente, debe ser string; se hace `trim`; vacío → `NULL`; > 32 chars → 400 `La categoría no puede superar los 32 caracteres`.
- `from`/`to`: regex ISO `YYYY-MM-DD` idéntica a la de `date`; inválida → 400 `La fecha debe tener formato AAAA-MM-DD`.
- Los filtros conservan el error 400 actual para `type` inválido.
El helper de datos recibe solo valores ya validados.

**4. Frontend servidos por la API, no por estado cliente**
Al aplicar un filtro se re-consulta `GET /api/transactions` con parámetros; los totales se calculan sobre el resultado devuelto. Alternativa: filtrar la lista en el cliente — se descarta: duplicaría la lógica y desincronizaría con el backend. `api.js` generaliza `listTransactions(token, params)` con serialización de query string.

**5. Categorías en la UI**
- Formulario (alta y edición): input con `<datalist>` de sugerencias fijas `Comida | Transporte | Vivienda | Sueldo | Salud | Entretenimiento | Otros`; texto libre permitido.
- Barra de filtros: `Filtrar por categoría` (select con `Todas` + categorías distintas del listado sin filtros + sugerencias de la UI), `Buscar por descripción`, `Desde`, `Hasta` y botón `Limpiar filtros`.
- Sección `Gastos por categoría`: agregación en el cliente sobre el listado filtrado (solo `expense`) con `formatAmount`, descartando transacciones sin categoría.
- Total de ingresos, total de gastos y saldo: recalculados sobre el listado filtrado (comportamiento declarado en spec).

## Risks / Trade-offs

- [Coincidencia textual de categorías: `Comida` y `comida` no colapsan en los totales por categoría] → Mitigación: el filtro es case-insensitive y el `<datalist>` reduce la variación; una entidad de categorías futura resolverá la normalización.
- [`LIKE` con `%`/`_` escapados por comodín duplica el esqueleto de la query] → Mitigación: escape solo sobre el parámetro `q`, sin afectar al resto de condiciones.
- [Fechas `from`/`to` más allá del rango de datos devuelven listas vacías sin error] → Mitigación: comportamiento de filtro estándar aceptable, documentado en spec (rango inclusivo).
- [El filtro por categoría pide el valor exacto y el usuario podría esperar parcial] → Mitigación: el select restringe a valores presentes/sugeridos; la búsqueda parcial queda cubierta por `q` (descripción).

## Migration Plan

- Bases nuevas: `CREATE TABLE IF NOT EXISTS transactions` ya incluye `category`.
- Bases existentes: `TRANSACTIONS_ALTERS` agrega `category TEXT` vía el bloque guiado por `PRAGMA table_info`; las filas existentes quedan con `NULL` (= sin categoría).
- Rollback: quitar columna, parámetros y UI; el resto del sistema no depende de `category`.

## Open Questions

- Ninguna: la normalización de categorías queda explícitamente fuera de alcance como non-goal, y las opciones de filtro surgidas del listado aparecerán según los datos reales del usuario.