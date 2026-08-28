# Tasks: Categories CRUD

## 1. Backend — Database & Migration

- [x] 1.1 Crear `backend/src/db.js` helper `ensureCategoriesTable(db)` que:
  - `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, name_lower TEXT GENERATED ALWAYS AS (lower(name)) STORED, type TEXT NOT NULL CHECK(type IN ('income','expense')), color TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id))`
  - `CREATE UNIQUE INDEX IF NOT EXISTS idx_cat_user_name ON categories(user_id, name_lower)`
  - Si tabla existe sin `name_lower` (SQLite <3.31 o migración parcial): `ALTER TABLE categories ADD COLUMN name_lower TEXT GENERATED ALWAYS AS (lower(name)) STORED` + `CREATE UNIQUE INDEX ...`
  - Wrapped en transacción.
- [x] 1.2 En `backend/src/server.js` startup (en `initDb()` existente), llamar `ensureCategoriesTable(db)` antes de `listen()`.
- [x] 1.3 Seeder idempotente en `ensureCategoriesTable` (o función separada `seedCategoriesFromTransactions(db)`):
  - `SELECT DISTINCT user_id, category, type FROM transactions WHERE category IS NOT NULL AND category != ''`
  - Agrupar por `user_id, category` → contar `type` → `type = (expense_count >= income_count) ? 'expense' : 'income'`
  - Color: `palette[(hash(user_id + category) % 10)]` con `palette = ['#6366f1','#8b5cf6','#a78bfa','#f59e0b','#ef4444','#10b981','#3b82f6','#ec4899','#14b8a6','#f97316']`
  - `INSERT OR IGNORE INTO categories (id, user_id, name, type, color, created_at) VALUES (?,?,?,?,?, datetime('now'))`
  - `id` = `crypto.randomUUID()` (Node 18+).
- [x] 1.4 Verificar migración: `npm run lint && npm test` (tests existentes pasan).

## 2. Backend — API Categories

- [x] 2.1 Crear `backend/src/routes/categories.js`:
  - `const palette = [...]` (10 colores).
  - `POST /` — validar JWT, body `{name, type, color}` → validaciones (req 1-32, type enum, color in palette, unicidad case-insensitive via `name_lower`) → `INSERT` → 201 `{id,name,type,color,created_at}`.
  - `GET /` — validar JWT → `SELECT id,name,type,color,created_at FROM categories WHERE user_id=? ORDER BY name COLLATE NOCASE` → 200 array.
  - `PUT /:id` — validar JWT, ownership (`WHERE id=? AND user_id=?`), validar body parcial → `UPDATE` → 200 actualizado.
  - `DELETE /:id` — validar JWT, ownership → verificar uso: `SELECT 1 FROM transactions WHERE user_id=? AND category=(SELECT name FROM categories WHERE id=?) LIMIT 1` + mismo para `budgets` → si existe 409 "No se puede eliminar: la categoría está en uso" → `DELETE` → 204.
  - Todos errores 400/404/409 con mensaje en español.
- [x] 2.2 Registrar en `backend/src/server.js`: `app.use('/api/categories', categoriesRouter)`.
- [x] 2.3 Tests `backend/test/categories.test.js` (Vitest, `:memory:`):
  - 2.2.1 Alta exitosa expense + income
  - 2.2.2 Duplicado case-insensitive (400)
  - 2.2.3 Color fuera paleta (400)
  - 2.2.4 Tipo inválido (400)
  - 2.2.5 Nombre vacío/largo (400)
  - 2.2.6 Listado vacío y con datos
  - 2.2.7 Aislamiento usuario A vs B
  - 2.2.8 Actualización propia vs ajena (404)
  - 2.2.9 Eliminar no usada (204) vs en uso transacciones (409) vs en uso presupuestos (409)
  - 2.2.10 Eliminar ajena (404)
- [x] 2.4 Tests integración `transactions.test.js` / `budgets.test.js`:
  - Crear transacción con categoría válida → 201
  - Crear transacción con categoría inexistente → 400 "La categoría no existe en tu catálogo"
  - Crear transacción sin categoría → 201 (null)
  - Crear presupuesto con categoría expense válida → 201
  - Crear presupuesto con categoría income → 400 "La categoría debe ser de tipo gasto"
  - Crear presupuesto con categoría inexistente → 400
- [x] 2.5 `npm run lint && npm test` → 134+ tests pasan.

## 3. Frontend — API & Nav

- [x] 3.1 En `frontend/src/api.js` agregar:
  - `listCategories(token)` → `GET /api/categories`
  - `createCategory(token, {name,type,color})` → `POST /api/categories`
  - `updateCategory(token, id, {name,type,color})` → `PUT /api/categories/:id`
  - `deleteCategory(token, id)` → `DELETE /api/categories/:id`
  - Cache simple `categoriesCache = {data: [], expiry: 0}` TTL 30s, invalidar en mutaciones.
- [x] 3.2 En `frontend/src/components/AppLayout.jsx`:
  - Import `Tag` de `lucide-react`
  - `NAV_ITEMS` insertar `{ to: '/categorias', label: 'Categorías', icon: Tag }` después de `Transacciones` (índice 2).
- [x] 3.3 En `frontend/src/main.jsx`:
  - Import `CategoriesPage` de `./pages/CategoriesPage.jsx`
  - Ruta protegida `<Route path="/categorias" element={<CategoriesPage />} />`.

## 4. Frontend — CategoriesPage

- [x] 4.1 Crear `frontend/src/pages/CategoriesPage.jsx`:
  - `PageHeader` no — header custom: `div flex items-center justify-between mb-6` con `h1 text-2xl font-semibold text-[#171d19] dark:text-white` "Categorías" + `Button` "+ Nueva" violeta `bg-[#6366f1]` `hover:bg-[#5b5bd6]` `Plus` icon.
  - Estado: `categories[]`, `modalOpen`, `editingId`, `form {name, type, color}`, `loading`, `error`.
  - `useEffect` cargar `listCategories` al montar + `refresh()`.
  - Grid: `div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"`.
  - Card: `div className="rounded-xl border border-[#E2E8F0] bg-white p-4 flex items-center gap-3 group hover:bg-[#F8FAFC] dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"`:
    - Dot: `span className="flex h-3 w-3 shrink-0 rounded-full" style={{backgroundColor: cat.color}}`
    - Columna: `p font-medium text-[#171d19] dark:text-white` nombre + `span className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium" + (cat.type==='expense' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600')` badge "Gasto"/"Ingreso"
    - Derecha: `div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100"` con `Pencil` (editar) y `Trash2` (borrar) `lucide-react`.
  - Modal `Dialog` `@headlessui/react`:
    - `Transition.Child` overlay + `Dialog.Panel` centrado `max-w-md w-full mx-4`.
    - Header: `h2 text-lg font-semibold` "Nueva categoría" / "Editar categoría".
    - Toggle tipo: `div flex gap-2` dos botones pill `Gasto`/`Ingreso` activo `bg-red-50 text-red-600` / `bg-green-50 text-green-600`, inactivo `bg-white border border-[#E2E8F0]`.
    - `Input` nombre `placeholder="Ej: Comida, Sueldo..."` `maxLength={32}`.
    - Color picker: `div className="grid grid-cols-5 gap-2"` 10 botones `h-8 w-8 rounded-full border-2` `style={{backgroundColor: palette[i]}}` activo `border-[#0e9f6e] border-2` + `Check` icon.
    - Footer: `Button variant="secondary"` Cancelar + `Button` Crear/Actualizar violeta `bg-[#6366f1]`.
    - Validación: nombre requerido, color requerido (default primer palette), tipo requerido.
  - `handleDelete`: `ConfirmDialog` existente → `deleteCategory` → `refresh()`.
  - `handleEdit`: set `editingId`, `form` con datos, abrir modal.
  - `handleCreate`: `createCategory` / `updateCategory` → `refresh()`, cerrar modal, `toast.showSuccess`.
- [x] 4.2 Importar iconos: `Plus`, `Pencil`, `Trash2`, `Check` de `lucide-react`.

## 5. Frontend — Integración Transacciones y Presupuestos

- [x] 5.1 En `frontend/src/pages/AppPage.jsx`:
  - Eliminar `SUGGESTED_CATEGORIES` + `datalist`.
  - `useEffect` cargar `listCategories` al montar → `setCategoryOptions(cats.filter(c=>c.type==='expense').map(c=>c.name))` (para gastos) + mantener `income` aparte si hace falta.
  - `Select` name="category" options desde `categoryOptions` (agregar `value=""` "Todas" para filtro, y para formulario solo `expense`).
  - En formulario `handleSubmit`: enviar `category` tal cual (backend valida).
- [x] 5.2 En `frontend/src/pages/BudgetPage.jsx`:
  - Igual: cargar `listCategories` filtrado `type==='expense'` → `Select` categorías gasto.
- [x] 5.3 En `frontend/src/categoryColor.js`:
  - Export `getCategoryColor(categoryName, userCategories[])` → busca en array, si existe usa `cat.color`, sino hash fallback actual.

## 6. Frontend — Verificación

- [x] 6.1 `npm run lint` (0 errors).
- [x] 6.2 `npm run build` (success).
- [x] 6.3 `docker compose build --no-cache backend frontend && docker compose up -d` → smoke test manual:
  - Login → navegar a `Categorías` → crear "Comida" gasto rojo → crear "Sueldo" ingreso verde → editar → borrar (si no usada) → 409 si usada.
  - Ir a `Transacciones` → formulario usa `Select` categorías → crear transacción con categoría válida → 201.
  - Intentar transacción con categoría inexistente → 400 mensaje español.
  - `Presupuestos` → Select categorías gasto.

## 7. Stitch (Opcional)

- [ ] 7.1 `stitch_edit_screens` generar screen `Categorías USAR` clonando mock (grid 3 cols, modal).
- [ ] 7.2 Actualizar `.stitch/metadata.json` agregar entrada `categorias` con nuevo `screenId` y título `Categorías USAR`.
- [ ] 7.3 Verificar `.stitch/components/Sidebar.html` orden nav incluye `Categorías` después de `Transacciones`.

## 8. Commit & PR

- [x] 8.1 `git add` todos los archivos modificados/nuevos.
- [x] 8.2 Commit `feat: add categories CRUD with management UI` (o varios commits atómicos).
- [x] 8.3 Push `feat/categories-crud` (nueva rama) o continuar en `feat/stitch-design-system` según política.
- [x] 8.4 PR hacia `master` con merge commit.
