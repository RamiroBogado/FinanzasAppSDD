# Design: transaction-exports

## Context

La API ya expone `GET /api/transactions` con filtros `type`, `category`, `q`, `from`, `to` validados en la ruta y centralizados en el helper `listTransactions(userId, params)` de `src/transactions.js`. La UI de Transacciones mantiene los filtros aplicados en el estado `appliedFilters`. La exportación reutiliza exactamente esa base, sin tocar endpoints ni helpers existentes.

## Goals / Non-Goals

- Goals: exportar transacciones propias filtradas a CSV, PDF y XLSX; resumen de totales en PDF y XLSX; descarga desde la interfaz con un clic.
- Non-Goals: exportar presupuestos o metas (changes futuros); programar exportaciones; exportaciones asíncronas para volúmenes grandes.

## Decisions

### D1. Un solo endpoint con parámetro de formato

`GET /api/transactions/export?format=csv|pdf|xlsx` declarado antes de la ruta `/:id` en `routes/transactions.js`. Alternativa descartada: tres endpoints separados, duplica validación y montaje sin beneficio.

### D2. Dependencias: pdfkit y exceljs

- `pdfkit`: generación de PDF en JavaScript puro, estándar del ecosistema Node, sin binarios nativos (compatible con la imagen alpine del backend).
- `exceljs`: libros XLSX mantenidos y sin dependencias nativas.
- CSV: se genera por concatenación con escaping propio, no justifica dependencia.

Ambas se justifican frente a las convenciones del proyecto porque no existen alternativas razonables sin dependencia para estos formatos.

### D3. Módulo exporters.js

Nuevo módulo plano `src/exporters.js` siguiendo el estilo del repo (`transactions.js`, `budgets.js`, `goals.js`) con funciones puras:

- `toCsv(transactions)`: BOM + encabezados + filas con `;`; valores escapados cuando contienen `"`, `;` o salto de línea; montos como `(amount / 100).toFixed(2)`.
- `toPdf(transactions)`: devuelve Buffer con título, fecha de generación, tabla y resumen (Total ingresos, Total gastos, Saldo).
- `toXlsx(transactions)`: devuelve Buffer con hoja `Transacciones` y hoja `Resumen`.
- Helper interno `sumByType(transactions)` para los totales.

Los tipos se muestran como `Ingreso`/`Gasto` en los tres formatos.

### D4. Respuesta de archivo

La ruta responde con `Content-Type` según formato (`text/csv; charset=utf-8`, `application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) y `Content-Disposition: attachment; filename="transacciones-<AAAA-MM-DD>.<ext>"`.

### D5. Descarga en el frontend con fetch + blob

El token viaja por header `Authorization`, por lo que no sirve un `<a href>` directo. Nuevo helper `exportTransactions(token, params, format)` en `api.js` que hace fetch, valida la respuesta, convierte a blob y dispara la descarga con object URL. El menú usa el componente `Menu` de Headless UI (ya instalado) con opciones CSV/PDF/XLSX.

### D6. Nombres y textos

Archivos: `transacciones-<fecha>.csv|.pdf|.xlsx`. Toasts: `Exportación descargada` al éxito; errores con el mensaje de la API. Texto de disparador: `Exportar`.

## Risks / Trade-offs

- [PDF con muchas filas] pdfkit pagina automáticamente; con volúmenes normales de uso personal el archivo crece linealmente. Mitigación: paginación nativa de pdfkit, sin límite adicional por ahora.
- [CSV abierto en Excel es-AR] Se elige `;` como separador porque es el separador de listas por defecto de Excel en locale español; el BOM garantiza acentos correctos.

## Migration Plan

Sin cambios de esquema ni de contratos existentes: solo se agrega una ruta y dos dependencias. Rollback = revertir el commit.

## Open Questions

Ninguna.
