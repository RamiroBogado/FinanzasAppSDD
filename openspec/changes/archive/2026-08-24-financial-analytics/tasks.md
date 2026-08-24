# Tasks: financial-analytics

## 1. Setup

- [x] 1.1 Crear rama `feature/financial-analytics`, issue en repo y ítem en board #3 (`@Board FinanzasAppSDD`) con Status `Todo` vía agente git

## 2. Backend — schema y presupuestos

- [x] 2.1 Agregar en `schema.js` la tabla `alerts` (`CREATE TABLE IF NOT EXISTS` + índice) y el bloque PRAGMA para `budgets.threshold INTEGER NOT NULL DEFAULT 80`
- [x] 2.2 Extender `routes/budgets.js`: validación y persistencia de `threshold` (opcional → 80 en creación, conservar en edición, 400 si inválido) e incluirlo en respuestas
- [x] 2.3 Tests Vitest de presupuesto: umbral por defecto, umbral inválido, edición conservando umbral, listado con `threshold`

## 3. Backend — alertas

- [x] 3.1 Crear `routes/alerts.js` con `GET /`, `POST /check`, `PUT /:id/read`, `POST /read-all` (dedupe, tipos warning/danger, mensajes ARS en español, aislamiento por usuario) y registrarla en `app.js`
- [x] 3.2 Tests Vitest de alertas: generación warning al umbral, danger al superar, sin duplicados en re-check, month inválido 400, aislamiento entre usuarios, mark-read individual y read-all, alerta ajena 404, acceso sin token
- [x] 3.3 Correr backend lint + test completo

## 4. Frontend — fundación

- [x] 4.1 Crear `PeriodContext.jsx` (persistencia localStorage validada, default mes actual) y `PeriodSelector.jsx`; integrar ambos en `AppLayout` (escritorio + panel mobile)
- [x] 4.2 Agregar helper `categoryColor(name)` con hash FNV-1a sobre paleta fija accesible claro/oscuro
- [x] 4.3 Extender `api.js`: `listAlerts`, `checkAlerts(month)`, `markAlertRead(id)`, `markAllAlertsRead`; soporte de `threshold` en create/update de presupuestos

## 5. Frontend — pantallas

- [x] 5.1 Dashboard: acotar KPIs y gastos por categoría al período; gráfico de evolución mensual (BarChart doble, ventana 6 meses); banner de alertas no leídas; disparar `check` al cargar
- [x] 5.2 Transacciones: acotar listado/totales/gastos por categoría al período vía `from`/`to`; `Limpiar filtros` conserva el período; disparar `check` tras alta/edición/eliminación
- [x] 5.3 Presupuestos: usar el período global (quitar selector local); campo opcional de umbral en formulario (default 80, editable en edición); aviso de umbral alcanzado además de `Presupuesto excedido`; aplicar `categoryColor`
- [x] 5.4 Crear `AlertsPage.jsx` (lista tipo/mensaje/fecha, `Marcar leída`, `Marcar todas`) con ruta protegida `/alertas` y badge unread en el acceso `Alertas`
- [x] 5.5 Aplicar colores consistentes por categoría en donut y lista del dashboard (y puntos donde aparezca categoría)

## 6. Pulido y paridad

- [x] 6.1 Revisar paridad claro/oscuro de gráfico, banner, página Alertas y badge
- [x] 6.2 Revisar responsive mobile del selector de período y de la página Alertas

## 7. Verificación

- [x] 7.1 Frontend lint + build
- [x] 7.2 Rebuild docker `app` + smoke E2E (período persistido, evolución mensual, umbral genera alerta, badge/banner/página Alertas, aislamiento)
- [x] 7.3 Validación visual del usuario en claro/oscuro y mobile
- [x] 7.4 Archive del change, board `Done`, commit y push vía agente git
