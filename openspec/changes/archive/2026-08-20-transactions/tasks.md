## 1. Backend: schema y datos

- [x] 1.1 Agregar tabla `transactions` al schema (`CREATE TABLE IF NOT EXISTS` con columnas `id`, `user_id`, `type` con CHECK, `amount`, `date`, `description`, `created_at`) mÃ¡s bloque de `ALTER` guiado por `PRAGMA table_info` para bases existentes e Ã­ndice `idx_transactions_user_date` en `schema.js`
- [x] 1.2 Crear `backend/src/transactions.js` con helpers de acceso a datos que filtran siempre por `user_id` (listar, obtener por id propio, crear, actualizar, eliminar)

## 2. Backend: endpoints

- [x] 2.1 Crear `backend/src/routes/transactions.js` con `POST /` (validaciÃ³n de tipo, monto entero positivo en centavos, fecha ISO o default, descripciÃ³n â‰¤ 255; errores 400 en espaÃ±ol) y respuestas 201
- [x] 2.2 Implementar `GET /` con ordenamiento por fecha descendente y filtro opcional por `type`, y `GET /:id` con 404 `TransacciÃ³n no encontrada` para id inexistente o ajeno
- [x] 2.3 Implementar `PUT /:id` (mismas validaciones de creaciÃ³n, 404 para id ajeno/inexistente, sin alterar `user_id`) y `DELETE /:id` (204 propio, 404 ajeno/inexistente)
- [x] 2.4 Montar las rutas en `app.js` bajo `/api/transactions` con `requireAuth`

## 3. Backend: tests

- [x] 3.1 Tests de creaciÃ³n: Ã©xito (con default de fecha), tipo invÃ¡lido, monto no entero positivo y descripciÃ³n demasiado larga
- [x] 3.2 Tests de listado: orden por fecha descendente, filtro por `type` y aislamiento entre dos usuarios
- [x] 3.3 Tests de consulta/actualizaciÃ³n/eliminaciÃ³n: 404 para transacciÃ³n ajena o inexistente en cada operaciÃ³n, y Ã©xito para transacciÃ³n propia
- [x] 3.4 Tests de autenticaciÃ³n: todas las operaciones responden 401 sin token vÃ¡lido

## 4. Frontend: helpers y API

- [x] 4.1 Crear `frontend/src/format.js` con `formatAmount` (ARS: sÃ­mbolo `$`, separador de miles, dos decimales) y `formatDate` (`dd/mm/aaaa`) reutilizables
- [x] 4.2 Agregar al API helper `listTransactions`, `createTransaction`, `updateTransaction` y `deleteTransaction` con el token Bearer existente

## 5. Frontend: vista `/app`

- [x] 5.1 Reconstruir `AppPage.jsx` como gestiÃ³n de transacciones: formulario de alta (tipo con opciones `Ingreso`/`Gasto`, monto, fecha, descripciÃ³n y botÃ³n `Agregar transacciÃ³n`), conservando el username y `Cerrar sesiÃ³n`
- [x] 5.2 Agregar listado de transacciones (fecha `dd/mm/aaaa`, monto ARS, descripciÃ³n) con acciones `Editar` y `Eliminar`, y ediciÃ³n reutilizando el formulario con `Guardar cambios` y `Cancelar`
- [x] 5.3 Mostrar totales de ingresos, gastos y saldo con formato ARS, recalculados tras cada operaciÃ³n

## 6. IntegraciÃ³n y verificaciÃ³n

- [x] 6.1 Verificar backend: `npm run lint` y `npm test` en `backend/`
- [x] 6.2 Verificar frontend: `npm run lint` y `npm run build` en `frontend/`
- [x] 6.3 Verificar arranque unificado: `docker compose up -d --build app` y validaciÃ³n en UI de alta, listado, ediciÃ³n, eliminaciÃ³n y aislamiento entre dos usuarios