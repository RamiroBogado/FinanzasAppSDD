## Why

La aplicación ya registra transacciones con categorías y filtros, pero todo vive en una única pantalla sin estructura: no hay una vista de resumen que oriente al usuario ni una forma de controlar cuánto gasta por categoría. Un layout con navegación lateral, un dashboard como vista principal y presupuestos mensuales por categoría dan el esqueleto de producto que exige el contexto (dashboard, presupuestos, metas, exportación, IA navegables desde una barra lateral).

## What Changes

- Backend: nueva tabla `budgets` (presupuesto mensual por categoría, un único por categoría y mes) y endpoints REST protegidos con JWT bajo `/api/budgets` (alta, listado con el total gastado del mes, consulta, edición, eliminación). El listado expone `spent` calculado solo con gastos propios de ese mes y categoría.
- Frontend: el área autenticada pasa a un layout con sidebar izquierda de navegación (`Dashboard`, `Transacciones`, `Presupuestos`), con el username y `Cerrar sesión` en la sidebar; el dashboard es la vista principal tras el login (totales de ingresos, gastos y saldo, gastos por categoría y últimos movimientos); la gestión de transacciones sigue en `Transacciones` y los presupuestos tienen su propia página con selector de mes, formulario de alta/edición, barra de progreso y alerta al superar el límite.
- Ningún cambio es **BREAKING**: la tabla es nueva, los endpoints nuevos, y la ruta `/app` redirige a `/transacciones`.
- Fuera de alcance: metas de ahorro, exportaciones, dashboard con gráficos, y la integración con el servicio IA (changes separados).

## Capabilities

### New Capabilities
- `budgets`: presupuestos mensuales por categoría con límite en monto, total gastado del período y gestión completa propia de cada usuario.
- `dashboard`: vista principal del área autenticada con resumen de ingresos, gastos, saldo, gastos por categoría y últimos movimientos.

### Modified Capabilities
- `transactions`: la gestión de transacciones pasa a una página accesible desde la sidebar del layout autenticado (`Dashboard`, `Transacciones`, `Presupuestos`), con el username y `Cerrar sesión` en la sidebar.

## Impact

- Backend: `schema.js` agrega la tabla `budgets` (CREATE + índice); `budgets.js` centraliza las queries con `WHERE user_id = ?` e incluye el total gastado vía subquery correlacionada; `routes/budgets.js` monta el CRUD en `/api/budgets` con `requireAuth` y validaciones 400/404/409 en español; `app.js` monta las rutas. Sin dependencias nuevas.
- Frontend: `AppLayout.jsx` (sidebar + contenido), `DashboardPage.jsx` y `BudgetPage.jsx` nuevos; `main.jsx` reestructura las rutas protegidas (con redirección de `/app`); `AppPage.jsx` quita el header propio; `api.js` agrega los métodos de presupuestos; `format.js` agrega `formatMonth`. Sin dependencias nuevas.
- ai: sin modificaciones.
- Verificación por capa: `npm run lint` + `npm test` en `backend/`; `npm run lint` + `npm run build` en `frontend/`; arranque unificado `docker compose up -d --build app` con validación en UI de navegación, dashboard, presupuestos y aislamiento entre dos usuarios.