## 1. Backend: schema y datos

- [x] 1.1 Agregar `category TEXT` a `CREATE_TRANSACTIONS_SQL` y a `TRANSACTIONS_ALTERS` en `schema.js` (bases nuevas y existentes)
- [x] 1.2 Generalizar `listTransactions(userId, filters?)` en `transactions.js`: clÃ¡usulas condicionales para `category` (case-insensitive), `q` (parcial en descripciÃ³n con escape de comodines) y `from`/`to` (rango inclusivo), manteniendo `WHERE user_id = ?` y el orden por fecha descendente
- [x] 1.3 Aceptar y normalizar `category` en `createTransaction`/`updateTransaction` (trim; vacÃ­a â†’ `NULL`)

## 2. Backend: endpoints

- [x] 2.1 Validar `category` en POST/PUT de `routes/transactions.js` (string, â‰¤ 32 caracteres â†’ 400 `La categorÃ­a no puede superar los 32 caracteres`; vacÃ­a normalizada a sin categorÃ­a)
- [x] 2.2 Validar `from`/`to` en GET de `routes/transactions.js` (ISO `AAAA-MM-DD` â†’ 400 `La fecha debe tener formato AAAA-MM-DD`) y pasar los filtros al helper de listado

## 3. Backend: tests

- [x] 3.1 Tests de creaciÃ³n/ediciÃ³n con categorÃ­a: Ã©xito, categorÃ­a de mÃ¡s de 32 caracteres â†’ 400, categorÃ­a vacÃ­a â†’ `category: null`
- [x] 3.2 Tests de listado filtrado: por categorÃ­a (case-insensitive), por `q` (parcial, case-insensitive), por `from`/`to` (inclusivo), combinaciÃ³n de filtros y `from`/`to` invÃ¡lidos â†’ 400
- [x] 3.3 Tests de aislamiento: los filtros de un usuario nunca devuelven transacciones de otro

## 4. Frontend: API

- [x] 4.1 Generalizar `listTransactions(token, params)` en `api.js` con serializaciÃ³n de query string (type, category, q, from, to)

## 5. Frontend: vista `/app`

- [x] 5.1 Agregar campo `CategorÃ­a` al formulario de alta/ediciÃ³n con `<datalist>` de sugerencias (Comida, Transporte, Vivienda, Sueldo, Salud, Entretenimiento, Otros)
- [x] 5.2 Agregar barra de filtros (`Filtrar por categorÃ­a`, `Buscar por descripciÃ³n`, `Desde`, `Hasta`, `Limpiar filtros`) que re-consulta el listado con parÃ¡metros
- [x] 5.3 Recalcular totales de ingresos, gastos y saldo sobre el resultado filtrado, y mostrar secciÃ³n `Gastos por categorÃ­a` con formato ARS
- [x] 5.4 Mostrar la categorÃ­a de cada transacciÃ³n en el listado y limpiar los filtros tras `Limpiar filtros`

## 6. IntegraciÃ³n y verificaciÃ³n

- [x] 6.1 Verificar backend: `npm run lint` y `npm test` en `backend/`
- [x] 6.2 Verificar frontend: `npm run lint` y `npm run build` en `frontend/`
- [x] 6.3 Verificar arranque unificado: `docker compose up -d --build app` y validaciÃ³n en UI de categorÃ­as, filtros, totales filtrados, gastos por categorÃ­a y aislamiento entre dos usuarios