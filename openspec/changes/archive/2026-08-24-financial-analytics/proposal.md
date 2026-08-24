# Proposal: financial-analytics

## Why

La aplicación registra datos pero ofrece poca lectura analítica: el dashboard resume totales históricos sin noción de período, no permite comparar la evolución de ingresos y gastos en el tiempo, los colores de categoría cambian entre visualizaciones (dependen del orden), y los presupuestos solo avisan cuando ya fueron excedidos. El usuario necesita herramientas para detectar tendencias y desvíos a tiempo, con un selector de período único que dé coherencia a toda la navegación.

## What Changes

- Selector de período global (mes y año, persistido localmente, inicia en el mes actual) visible en la barra lateral que gobierna Dashboard, Transacciones y Presupuestos.
- Dashboard acotado al período seleccionado: totales de ingresos, gastos y balance sobre las transacciones del mes; gráfico nuevo de evolución mensual con barras dobles (ingresos vs gastos) de los últimos 6 meses.
- Colores consistentes por categoría: color estable asignado por nombre, independiente del orden o la cantidad de categorías, aplicado en gráficos e indicadores.
- Umbral configurable por presupuesto (entero 1–100, por defecto 80) en API e interfaz.
- Sistema completo de alertas de presupuesto: tabla persistente, generación al verificar presupuestos del período (warning al alcanzar el umbral, danger al superar el límite), sin duplicados, página `Alertas` con control de lectura individual y masiva, badge de no leídas en la barra lateral y banner resumen en el Dashboard.

## Capabilities

### New Capabilities

- `alerts`: alertas de presupuesto persistentes por usuario, generadas desde la verificación de presupuestos del período, con listado propio, control de lectura, integración en la interfaz (página, badge y banner) y aislamiento estricto.

### Modified Capabilities

- `budgets`: creación, actualización y listado incorporan el campo `threshold`; la interfaz suma el campo de umbral al formulario y usa el período global en lugar del selector local de mes.
- `dashboard`: los totales y gastos por categoría pasan de calcularse sobre todas las transacciones al período seleccionado; se agrega la evolución mensual con barras dobles.
- `transactions`: la gestión en la interfaz pasa a mostrar por defecto las transacciones del período global, combinable con los filtros existentes.
- `ui`: la barra lateral incorpora el acceso `Alertas` con badge de no leídas y el selector de período global persistido; colores deterministas y consistentes para categorías.

## Impact

- **backend**: `src/schema.js` (ALTER `budgets.threshold` guiado por PRAGMA + tabla `alerts`), `src/routes/budgets.js` (validación y persistencia de `threshold`), nuevo `src/routes/alerts.js`, registro en `src/app.js`; tests Vitest nuevos.
- **frontend**: `src/context/PeriodContext.jsx` y `src/components/PeriodSelector.jsx` nuevos, `AppLayout.jsx` (selector, acceso Alertas con badge), `DashboardPage.jsx` (acotación por período, gráfico de barras dobles, banner de alertas), `AppPage.jsx` (acotación por período), `BudgetPage.jsx` (período global + umbral), nueva `AlertsPage.jsx`, `api.js` (endpoints de alertas y `threshold`), helper `categoryColor`.
- **Sin cambios**: servicio de IA (`ai/`), modelo de datos de transacciones y metas, exportaciones.
