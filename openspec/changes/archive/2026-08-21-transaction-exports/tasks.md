# Tasks: transaction-exports

## 1. Setup

- [x] 1.1 Crear rama `feature/transaction-exports` e issue en board #3 (`@Board FinanzasAppSDD`) con Status `Todo` vía agente git
- [x] 1.2 Instalar `pdfkit` y `exceljs` en backend

## 2. Backend

- [x] 2.1 Crear `src/exporters.js` con `toCsv`, `toPdf`, `toXlsx` y cálculo de totales (Ingreso/Gasto en español)
- [x] 2.2 Agregar `GET /api/transactions/export` en `routes/transactions.js` antes de `/:id`, con validación de formato y filtros, Content-Disposition y filename con fecha del día
- [x] 2.3 Crear `test/transactions-export.test.js` (auth, formato inválido, filtros inválidos, contenido CSV, PDF válido con totales, XLSX válido, filtros aplicados, aislamiento) y correr lint + test

## 3. Frontend

- [x] 3.1 Agregar helper de descarga por formato en `api.js`
- [x] 3.2 Agregar menú `Exportar` (CSV/PDF/XLSX) en la sección Filtros de `AppPage.jsx` con descarga blob y toasts
- [x] 3.3 Correr frontend lint + build

## 4. Verificación y cierre

- [x] 4.1 Reconstruir docker y validar HTTP E2E: descarga de los 3 formatos con filtros y aislamiento entre usuarios
- [x] 4.2 Validación visual del usuario en claro/oscuro y mobile
- [ ] 4.3 Archive del change, board `Done`, commit y push vía agente git
