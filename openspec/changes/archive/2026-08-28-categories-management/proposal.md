# Proposal: Categories CRUD

## Why

Actualmente la categoría es un campo de texto libre (TEXT 32, opcional) en `transactions` y `budgets`, sin catálogo central, sin validación de unicidad, sin color persistido y sin UI dedicada. Esto genera duplicados, inconsistencias ("Comida" vs "comida" vs "Comidas") y dificulta reportes y filtros. El mock del usuario muestra un catálogo gestionable con grid de cards, modal de creación y colores fijos, lo cual resuelve la UX y la integridad de datos.

## What Changes

- **Nueva tabla `categories`** en SQLite: `id`, `user_id` (FK users), `name` (32, único case-insensitive por usuario), `type` (`income`|`expense`), `color` (hex de paleta cerrada de 10 colores), `created_at`. Índice único `UNIQUE(user_id, lower(name))`. Aislamiento estricto por `user_id` (regla AGENTS.md:53).
- **API CRUD** en `backend/src/routes/categories.js`: `POST /api/categories`, `GET /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`. Todas requieren JWT, mensajes de error en español, 409 al borrar si la categoría está en uso en `transactions` o `budgets`.
- **Migración idempotente**: `ALTER TABLE` + seeder que autocrea categorías desde `transactions.category` distintas del usuario (tipo inferido por `type` mayoritario, color round-robin de paleta).
- **Validación opcional** en `transactions.js` y `budgets.js`: si se envía `category`, verificar que existe en catálogo del usuario (400 si no), pero mantener compatibilidad (campo opcional).
- **Frontend**:
  - `AppLayout.jsx`: nuevo item `Categorías` (icono `Tag`) en `NAV_ITEMS` después de `Transacciones`.
  - `main.jsx`: ruta protegida `/categorias` → `CategoriesPage`.
  - Nueva `CategoriesPage.jsx`: header "Categorías" + botón "+ Nueva" (violeta `#6366f1`), grid responsive (1/2/3 cols) de cards blancas con dot de color, nombre, badge "Gasto" (rosa `#ef4444`) / "Ingreso" (verde `#10b981`), iconos editar/borrar. Modal `@headlessui/react` con toggle Gasto/Ingreso (pill activo), input nombre, color picker 10 circulares (paleta fija), CTA "Crear categoría" violeta. Editar reutiliza modal.
  - `AppPage.jsx` y `BudgetPage.jsx`: reemplazar `SUGGESTED_CATEGORIES` + `datalist` por `<Select>` poblado desde `GET /api/categories` (filtrado por `type` si aplica).
  - `categoryColor.js`: usar `color` persistido si existe, fallback a hash actual.
- **Stitch (opcional)**: screen `Categorías USAR` clonando mock, actualizar `metadata.json` y `Sidebar.html` (el nav ya existe).
- **Specs OpenSpec**: nueva capability `categories` + deltas en `transactions` y `budgets`.

**BREAKING**: Ninguno — campo `category` sigue opcional, validación solo si se envía.

## Capabilities

### New Capabilities
- `categories` — Gestión completa de categorías de usuario (CRUD, listado, validación, aislamiento, colores, migración).

### Modified Capabilities
- `transactions` — Delta: validación opcional de `category` contra catálogo del usuario al crear/actualizar.
- `budgets` — Delta: validación opcional de `category` contra catálogo del usuario al crear/actualizar.

## Impact

**Backend**: nueva tabla, 4 endpoints, tests Vitest (CRUD, aislamiento, unicidad case-insensitive, 409 en uso, validación), migración.
**Frontend**: nueva página, nav item, integración en `Transacciones` y `Presupuestos`, build y lint.
**Specs**: `specs/categories/spec.md`, `specs/transactions/spec.md` (delta), `specs/budgets/spec.md` (delta).
**Stitch**: opcional, 1 screen nueva.
**AI**: sin cambios (vector store no toca categorías).
**Dependencies**: `better-sqlite3` existente, `@headlessui/react` existente, `lucide-react` existente.