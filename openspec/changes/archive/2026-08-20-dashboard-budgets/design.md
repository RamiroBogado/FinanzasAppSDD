## Context

El backend monta rutas por recurso en `app.js` (`/api/auth`, `/api/transactions`) con `requireAuth` y el schema usa `ensureTable` (CREATE + bloque `ALTER` por `PRAGMA`); las categorías son texto libre en las transacciones (columna `category`). El frontend tiene el API helper centralizado (`api.js`), helpers `format.js` (`formatAmount`, `formatDate`), `ProtectedRoute` y una única página autenticada (`AppPage.jsx`, ruta `/app`). Motivación y alcance en `proposal.md`; comportamiento exigido en `specs/{budgets,dashboard,transactions}/spec.md`.

## Goals / Non-Goals

**Goals:**
- Tabla `budgets` idempotente con unicidad por categoría y mes (case-insensitive) y listado con `spent` por período.
- CRUD REST protegido bajo `/api/budgets` con errores en español (400/404/409).
- Layout autenticado con sidebar (`Dashboard`, `Transacciones`, `Presupuestos`) que reemplaza el header por página.
- Dashboard como vista principal con totales, gastos por categoría y últimos movimientos.
- Página de presupuestos con selector de mes, progreso y alerta de excedido.

**Non-Goals:**
- Presupuestos globales (sin categoría) o por período distinto al mes: cambios futuros.
- Metas de ahorro, exportaciones, gráficos del dashboard y servicio IA: changes separados.
- Normalización de categorías como entidad: sigue siendo texto libre (decisión heredada de `categories-filters`).

## Decisions

**1. Tabla `budgets` con unicidad `(user_id, category COLLATE NOCASE, month)`**
Columnas: `id`, `user_id` (FK → `users.id`), `category TEXT NOT NULL`, `month TEXT NOT NULL` (`AAAA-MM`), `amount INTEGER NOT NULL` (centavos), `created_at`. El UNIQUE compuesto con `COLLATE NOCASE` replica la comparación case-insensitive del filtro de categorías y evita `Comida`/`comida` duplicados. Alternativa: validar duplicados solo en el router (query previa) — se descarta: la constraint es la garantía final y cubre la carrera entre request.

**2. `spent` calculado en el backend con subquery correlacionada**
```sql
SELECT b.*,
  (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
   WHERE t.user_id = b.user_id AND t.type = 'expense'
     AND t.date >= b.month || '-01' AND t.date <= b.month || '-31'
     AND lower(t.category) = lower(b.category)) AS spent
FROM budgets b WHERE b.user_id = ?
```
Un solo query por listado; el límite superior `-31` es seguro en comparación lexicográfica para cualquier mes real. Alternativa: `GROUP BY` con JOIN — se descarta: las transacciones sin presupuesto no deben eliminar filas del listado (LEFT JOIN + COALESCE) y la subquery es más legible y evita filas nulas.

**3. Rutas REST bajo `/api/budgets` protegidas con `requireAuth`**
- `POST /`: `category` obligatoria (recortada, ≤ 32 chars → 400 `La categoría es obligatoria y no puede superar los 32 caracteres`... — se prioriza el mensaje de categoría vacía `La categoría es obligatoria`), `month` regex `^\d{4}-(0[1-9]|1[0-2])$` → 400 `El mes debe tener formato AAAA-MM`, `amount` entero positivo → 400 `El monto debe ser un número entero positivo (en centavos)`; duplicado → 409 `Ya existe un presupuesto para esa categoría y mes`.
- `GET /`: propios con `spent`; `?month=` (400 si inválido) y `?category=` opcionales.
- `GET/PUT/DELETE /:id`: 404 `Presupuesto no encontrado` para ajeno/inexistente (misma respuesta para no filtrar existencia); PUT revalida y también responde 409 ante duplicación; DELETE 204.

**4. Helpers de acceso a datos en `backend/src/budgets.js`**
Patrón de `transactions.js`/`users.js`: todas las queries con `WHERE user_id = ?`; el router solo valida y responde. `toPublicBudget` expone `id`, `category`, `month`, `amount`, `spent`, `createdAt`.

**5. Layout con sidebar y rutas reorganizadas**
- `AppLayout.jsx`: componente protegido con `NavLink` de react-router para resaltar la página activa; sidebar con nombre de la app, accesos `Dashboard`, `Transacciones`, `Presupuestos` y al pie el username + `Cerrar sesión`.
- `main.jsx`: `/dashboard` (DashboardPage, vista principal), `/transacciones` (AppPage), `/presupuestos` (BudgetPage) dentro del layout protegido; `/app` redirige a `/transacciones` (`Navigate`) para no romper accesos previos; tras login se navega a `/dashboard`.
- `AppPage.jsx` pierde su header propio (username/logout viven en la sidebar) y mantiene filtros, formulario, listado y totales y gastos por categoría.

**6. Dashboard sin backend nuevo**
Una sola llamada `GET /api/transactions` (lista completa propia) y agregación en cliente: totales, gastos por categoría y últimos 10 movimientos (el listado ya viene ordenado por fecha desc). Alternativa: endpoint de agregados — se descarta: duplicaría lógica y no aporta escala en este tamaño de datos; los agregados por mes podrán justificar un endpoint en un change de dashboard avanzado.

**7. Página de presupuestos**
- Selector `input type="month"` con default al mes actual (helper `formatMonth('AAAA-MM')` → `Agosto 2026` para el encabezado).
- Formulario de alta/edición: categoría con `<datalist>` (mismo set sugerido que transacciones + categorías existentes del mes), mes y monto en pesos convertido a centavos; botones `Agregar presupuesto` / `Guardar cambios` + `Cancelar`.
- Listado: categoría, límite y `spent` con `formatAmount` ARS, barra de progreso (porcentaje = spent/amount), alerta `Presupuesto excedido` en rojo cuando `spent > amount`, y mensaje `Sin presupuestos para este mes` cuando el mes no tiene presupuestos.
- `api.js`: `listBudgets(token, params)`, `createBudget`, `updateBudget`, `deleteBudget`.

## Risks / Trade-offs

- [`spent` se calcula contra las transacciones textuales: renombrar la categoría de una transacción no actualiza presupuestos automáticamente] → Mitigación: es coherente con categorías de texto libre; la entidad de categorías (change futuro) resolverá referencias.
- [Listado de presupuestos sin paginación] → Mitigación: un presupuesto por categoría y mes limita el volumen por usuario; aceptable en esta escala.
- [Mover `/app` puede romper enlaces guardados] → Mitigación: redirección `Navigate` permanente hacia `/transacciones`.
- [La subquery correlacionada repite el cálculo por presupuesto] → Mitigación: acotada por `user_id` e índice `(user_id, month)`; volumen por usuario bajo.

## Migration Plan

- Bases nuevas: `CREATE TABLE IF NOT EXISTS budgets` + índice `idx_budgets_user_month (user_id, month)` al arrancar.
- Bases existentes: `ensureTable` con `BUDGETS_ALTERS` (defaults aditivos) cubre tablas parciales; las existentes no tienen la tabla, se crea sin migraciones.
- Rollback: retirar rutas, helpers y página; la tabla puede permanecer sin afectar al resto.

## Open Questions

- Ninguna: el alcance (todo junto), el contenido del dashboard y la estructura con sidebar fueron resueltos con el usuario al aprobar el plan.