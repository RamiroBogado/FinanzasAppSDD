# Tasks: savings-goals

## 1. Setup

- [x] 1.1 Crear rama `feature/savings-goals` e issue en board #3 (`@Board FinanzasAppSDD`) con Status `Todo` vía agente git

## 2. Backend

- [x] 2.1 Agregar tabla `goals`, índice y alters en `schema.js` con `ensureTable`
- [x] 2.2 Crear `goals.js` con helpers de consulta y `toPublicGoal` (camelCase)
- [x] 2.3 Crear `routes/goals.js` con validaciones en español y montar en `app.js`
- [x] 2.4 Crear `test/goals.test.js` (CRUD, validaciones, aislamiento, auth) y correr lint + test

## 3. Frontend

- [x] 3.1 Agregar helpers de goals en `api.js`
- [x] 3.2 Agregar acceso `Metas` en `AppLayout.jsx` y ruta `/metas` en `main.jsx`
- [x] 3.3 Crear primitiva `ui/AmountDialog.jsx`
- [x] 3.4 Crear `pages/GoalPage.jsx` con formulario, tarjetas de progreso, aportes/retiros, confirmación, toasts, skeletons y estado vacío
- [x] 3.5 Correr frontend lint + build

## 4. Verificación y cierre

- [x] 4.1 Reconstruir docker y validar HTTP E2E con dos usuarios (CRUD, aportes, retiros, aislamiento)
- [x] 4.2 Validación visual del usuario en claro/oscuro y mobile
- [ ] 4.3 Archive del change, board `Done`, commit y push vía agente git
