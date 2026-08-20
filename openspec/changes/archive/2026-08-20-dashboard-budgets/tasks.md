## 1. Backend: schema y datos

- [x] 1.1 Agregar tabla `budgets` (`id`, `user_id` FK, `category`, `month`, `amount`, `created_at`, `UNIQUE (user_id, category COLLATE NOCASE, month)`) e Ã­ndice `idx_budgets_user_month` en `schema.js` con `ensureTable`
- [x] 1.2 Crear `backend/src/budgets.js` con helpers que filtran siempre por `user_id` (listar con `spent` vÃ­a subquery, obtener por id propio, crear, actualizar, eliminar) y `toPublicBudget`

## 2. Backend: endpoints

- [x] 2.1 Crear `backend/src/routes/budgets.js` con `POST /` (categorÃ­a obligatoria â‰¤ 32, mes `AAAA-MM`, monto entero positivo; errores 400 en espaÃ±ol; duplicado â†’ 409 `Ya existe un presupuesto para esa categorÃ­a y mes`) y respuestas 201
- [x] 2.2 Implementar `GET /` (listado propio con `spent`, filtros opcionales `month` validado y `category`) y `GET /:id` con 404 `Presupuesto no encontrado` para id inexistente o ajeno
- [x] 2.3 Implementar `PUT /:id` (mismas validaciones, 409 ante duplicaciÃ³n, 404 para id ajeno/inexistente, sin alterar `user_id`) y `DELETE /:id` (204 propio, 404 ajeno/inexistente)
- [x] 2.4 Montar las rutas en `app.js` bajo `/api/budgets` con `requireAuth`

## 3. Backend: tests

- [x] 3.1 Tests de creaciÃ³n/actualizaciÃ³n: Ã©xito, categorÃ­a vacÃ­a, mes invÃ¡lido, monto invÃ¡lido y duplicado (409) en POST y PUT
- [x] 3.2 Tests de `spent`: suma solo gastos del mismo mes y categorÃ­a (case-insensitive), presupuesto sin gastos en cero, y consulta individual con `spent`
- [x] 3.3 Tests de listado: filtro por `month` y `category`, mes invÃ¡lido â†’ 400, 404s de consulta/ediciÃ³n/eliminaciÃ³n (ajenos e inexistentes)
- [x] 3.4 Tests de aislamiento entre dos usuarios y 401 sin token en todas las operaciones

## 4. Frontend: API y formato

- [x] 4.1 Agregar a `api.js` `listBudgets` (con parÃ¡metros), `createBudget`, `updateBudget` y `deleteBudget` con el token Bearer
- [x] 4.2 Agregar `formatMonth` en `format.js` (`AAAA-MM` â†’ nombre de mes en espaÃ±ol)

## 5. Frontend: layout y navegaciÃ³n

- [x] 5.1 Crear `AppLayout.jsx` con sidebar (`Dashboard`, `Transacciones`, `Presupuestos` con estado activo) y username + `Cerrar sesiÃ³n`
- [x] 5.2 Reestructurar `main.jsx`: rutas protegidas `/dashboard`, `/transacciones` y `/presupuestos` dentro del layout, redirecciÃ³n de `/app` a `/transacciones`, y login navegando a `/dashboard`
- [x] 5.3 Quitar el header propio de `AppPage.jsx` (username y `Cerrar sesiÃ³n` pasan a la sidebar)

## 6. Frontend: dashboard

- [x] 6.1 Crear `DashboardPage.jsx` con tarjetas de totales (ingresos, gastos, saldo), gastos por categorÃ­a y Ãºltimos 10 movimientos con formatos ARS y `dd/mm/aaaa`

## 7. Frontend: presupuestos

- [x] 7.1 Crear `BudgetPage.jsx`: selector de mes (default actual), formulario de alta/ediciÃ³n (categorÃ­a con sugerencias, mes, monto; `Agregar presupuesto`/`Guardar cambios`/`Cancelar`) y listado con lÃ­mite, gastado, progreso y alerta `Presupuesto excedido`, con `Editar`/`Eliminar` y vacÃ­o `Sin presupuestos para este mes`

## 8. IntegraciÃ³n y verificaciÃ³n

- [x] 8.1 Verificar backend: `npm run lint` y `npm test` en `backend/`
- [x] 8.2 Verificar frontend: `npm run lint` y `npm run build` en `frontend/`
- [x] 8.3 Verificar arranque unificado: `docker compose up -d --build app` y validaciÃ³n en UI de navegaciÃ³n con sidebar, dashboard con datos, presupuestos (progreso y excedido) y aislamiento entre dos usuarios