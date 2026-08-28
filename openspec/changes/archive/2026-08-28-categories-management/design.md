# Design: Categories CRUD

## Context

See `proposal.md` - Why. Resumen: hoy categoría es texto libre en `transactions`/`budgets` sin catálogo, validación ni UI. Mock del usuario muestra grid + modal con paleta fija 10 colores.

## Goals / Non-Goals

**Goals:**
- Tabla `categories` con aislamiento por `user_id`, unicidad case-insensitive, paleta 10 colores fija.
- API CRUD completa con JWT, 409 si categoría en uso.
- Migración idempotente + seeder desde transacciones existentes.
- Frontend: nav `Categorías`, `CategoriesPage` (grid + modal), integración en `Transacciones`/`Presupuestos`.
- Specs: nueva capability `categories`, deltas en `transactions`/`budgets`.

**Non-Goals:**
- FK estricta en BD (compatibilidad: campo opcional).
- AI / vector store cambios.
- Paleta editable por usuario (fija 10 colores).
- Categorías globales/compartidas entre usuarios.

## Decisions

| Decisión | Elección | Razón / Alternativas |
|----------|----------|----------------------|
| Tabla `categories` | Nueva tabla independiente | Evita ALTER sobre `transactions`/`budgets`, aislamiento nativo, FK lógica en app |
| Unicidad | `UNIQUE(user_id, lower(name))` | SQLite no soporta collation case-insensitive nativo en UNIQUE; `lower()` en índice funcional via trigger o normalización en app. Elegimos normalizar a `lower(name)` en INSERT/UPDATE + índice único compuesto. |
| Paleta colores | 10 hex fijos, no configurables | Simplicidad, consistencia visual, evita color picker libre (complejidad UX). Mock usa 10. |
| Color storage | `TEXT(7)` hex (`#rrggbb`) | Compacto, directo para CSS `backgroundColor`. |
| Tipo categoría | `TEXT CHECK(type IN ('income','expense'))` | Presupuestos solo `expense`; transacciones ambos. Validación en app + CHECK. |
| Migración seeder | Round-robin paleta, tipo por mayoría `type` en transacciones | Determinista, idempotente. Si usuario tiene "Comida" 5× expense + 1× income → tipo expense. |
| Validación en `transactions`/`budgets` | Solo si `category` no vacío, case-sensitive vs catálogo | Campo sigue opcional. Case-sensitive para que "Comida" ≠ "comida" en transacción, pero catálogo es case-insensitive único — usuario crea "Comida", luego transacción con "Comida" pasa, "comida" falla (consistencia UX). |
| Borrado 409 | Verificar `transactions.category` + `budgets.category` del usuario | Evita datos huérfanos. Mensaje español "No se puede eliminar: la categoría está en uso". |
| Frontend modal | `@headlessui/react` `Dialog` | Ya en deps, usado en `ConfirmDialog`. |
| Color picker | 10 botones circulares, sin input libre | Mock y paleta fija. |
| Icono nav | `Tag` (lucide-react) | Semántica categoría/etiqueta. Ya en deps. |
| Stitch screen | Clonar mock, no bloqueante | Alineado a `Finanza Modern`, `FINANZASAPP` lockup, `metadata.json` actualizado. |

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Duplicados case-insensitive en BD sin trigger | Normalizar a `lower(name)` en INSERT/UPDATE en ruta `categories.js` antes de query; índice único `UNIQUE(user_id, name_lower)` con columna generada `name_lower TEXT GENERATED ALWAYS AS (lower(name)) STORED` (SQLite 3.31+) o columna normal + trigger. SQLite en uso `better-sqlite3` 3.45+ soporta generated columns. **Elegido**: columna `name_lower` generada + `UNIQUE(user_id, name_lower)`. |
| Migración falla en BD existentes | `PRAGMA table_info(categories)` → si no existe, `CREATE TABLE` con generated column; si existe sin generated column, `ALTER TABLE ADD COLUMN name_lower` + `UPDATE SET name_lower=lower(name)` + `CREATE UNIQUE INDEX`. Wrapped en transacción. |
| Seeder crea categorías con color aleatorio inconsistente | Round-robin determinista sobre paleta ordenada; seed por `user_id` hash para reproducibilidad. |
| `transactions`/`budgets` existentes con categorías que no existen en catálogo nuevo | Validación solo al crear/actualizar; datos viejos intactos. UI muestra categoría como texto si no está en catálogo (fallback). |
| Performance listar categorías en cada transacción/presupuesto | Cache en `api.js` `listCategories` (TTL 30s) + invalidar en mutaciones. 10-50 items por usuario, trivial. |
| Frontend `Select` sin categorías al abrir formulario | Cargar `GET /api/categories` al montar `AppPage`/`BudgetPage` + `useEffect` refresh. Loading skeleton. |

## Migration Plan

1. **Backend DB** (`backend/src/db.js` patrón):
   - `CREATE TABLE IF NOT EXISTS categories (...)` con `name_lower TEXT GENERATED ALWAYS AS (lower(name)) STORED`, `UNIQUE(user_id, name_lower)`.
   - Si tabla existe sin `name_lower`: `ALTER TABLE categories ADD COLUMN name_lower TEXT GENERATED ALWAYS AS (lower(name)) STORED` (requiere SQLite 3.31+), luego `CREATE UNIQUE INDEX idx_cat_user_name ON categories(user_id, name_lower)`.
   - Seeder: `SELECT DISTINCT user_id, category, type FROM transactions WHERE category IS NOT NULL AND category != ''` + mismo para `budgets` → agrupar por `user_id, category` → contar `type` → inferir `type` mayoría → asignar color `palette[hash(user_id+category) % 10]` → `INSERT OR IGNORE INTO categories`.
   - Ejecutar en `server.js` startup antes de `listen()` (patrón existente `initDb()`).

2. **Backend rutas**: nuevo `categories.js` → `app.use('/api/categories', categoriesRouter)` en `server.js`.

3. **Backend validación**: en `transactions.js`/`budgets.js` `create`/`update` → si `category` → `SELECT 1 FROM categories WHERE user_id=? AND name=?` (case-sensitive) → 400 si no existe.

4. **Frontend api**: `listCategories, createCategory, updateCategory, deleteCategory` en `api.js`.

5. **Frontend nav**: `AppLayout.jsx` `NAV_ITEMS` insertar después de `Transacciones`; `main.jsx` ruta `/categorias`.

6. **Frontend páginas**: `CategoriesPage.jsx` + refactor `AppPage.jsx`/`BudgetPage.jsx` `Select` desde `listCategories`.

7. **Stitch**: `stitch_edit_screens` generar `Categorías USAR` + actualizar `metadata.json` + `Sidebar.html` (orden nav).

8. **Tests**: backend `test/categories.test.js` + frontend build/lint.

9. **Deploy**: `docker compose build --no-cache backend frontend` + `up -d` + smoke test.

## Open Questions

- ¿Validar también `budgets.category` contra `type='expense'` en backend? (Spec dice sí, ya en delta budgets).
- ¿Mostrar categoría "desconocida" en listado transacciones si no está en catálogo? (Sí, texto plano con dot gris).
- ¿Permitir reordenar categorías en UI? (No en MVP, orden alfabético).