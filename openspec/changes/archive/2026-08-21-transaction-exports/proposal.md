# Proposal: transaction-exports

## Why

Los usuarios necesitan llevar sus datos financieros fuera de la aplicación para archivarlos, imprimirlos o analizarlos en otras herramientas. Hoy la única vía de salida es copiar a mano desde la interfaz. La exportación de transacciones en formatos universales cierra esa brecha con bajo esfuerzo y sin tocar el modelo de datos.

## What Changes

- Nuevo endpoint `GET /api/transactions/export?format=csv|pdf|xlsx` protegido por JWT que exporta las transacciones del usuario autenticado aplicando los mismos filtros del listado (`type`, `category`, `q`, `from`, `to`).
- Generación de archivos: CSV (UTF-8 con BOM, separador `;`), PDF con resumen de totales (ingresos, gastos y saldo) y XLSX con hoja de transacciones y hoja de resumen.
- Nuevas dependencias en backend: `pdfkit` y `exceljs`, justificadas por ser librerías puras de JavaScript mantenidas, sin binarios nativos.
- Interfaz: botón `Exportar` con menú CSV/PDF/XLSX en la sección Filtros de Transacciones; descarga los archivos aplicando los filtros activos mediante fetch + blob.

## Capabilities

### New Capabilities

- `exports`: exportación de transacciones del usuario autenticado en CSV, PDF y XLSX desde la API y la interfaz.

## Impact

- **backend**: `package.json` (+2 dependencias), nuevo módulo `src/exporters.js`, nueva ruta en `src/routes/transactions.js`, tests en `test/`.
- **frontend**: helper en `src/api.js`, menú de exportación en `src/pages/AppPage.jsx`.
- Sin cambios de esquema de base de datos ni de endpoints existentes.
