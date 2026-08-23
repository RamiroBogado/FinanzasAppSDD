# exports Specification

## Purpose

Permite que cada usuario descargue sus transacciones en formatos universales (CSV, PDF y XLSX) aplicando los mismos filtros del listado, para archivarlas o analizarlas fuera de la aplicación.

## ADDED Requirements

### Requirement: Exportación de transacciones en CSV
El sistema DEBE permitir exportar las transacciones del usuario autenticado mediante `GET /api/transactions/export?format=csv` con un token JWT válido. El archivo DEBE ser CSV en UTF-8 con BOM y separador `;`, con encabezados `Fecha;Tipo;Categoría;Descripción;Monto` y una fila por transacción ordenada como el listado, donde Tipo se expresa como `Ingreso` o `Gasto` y Monto usa formato decimal con punto. El sistema DEBE responder el archivo con `Content-Disposition: attachment`.

#### Scenario: Descarga de CSV
- **WHEN** el usuario autenticado solicita la exportación CSV habiendo creado transacciones propias
- **THEN** el sistema responde un archivo CSV que incluye los encabezados y una fila por cada transacción propia

### Requirement: Exportación de transacciones en PDF con resumen de totales
El sistema DEBE permitir exportar las transacciones del usuario autenticado mediante `GET /api/transactions/export?format=pdf`. El archivo DEBE ser un PDF válido que incluya fecha de generación, una fila por transacción y un resumen de totales con Total ingresos, Total gastos y Saldo (ingresos menos gastos) calculados sobre las transacciones exportadas.

#### Scenario: PDF con totales correctos
- **WHEN** el usuario autenticado exporta a PDF transacciones propias con ingresos y gastos
- **THEN** el sistema responde un PDF válido cuyo contenido incluye el total de ingresos, el total de gastos y el saldo correspondientes a esas transacciones

### Requirement: Exportación de transacciones en XLSX
El sistema DEBE permitir exportar las transacciones del usuario autenticado mediante `GET /api/transactions/export?format=xlsx`. El archivo DEBE ser un libro XLSX válido con una hoja de transacciones (Fecha, Tipo, Categoría, Descripción, Monto) y una hoja de resumen con Total ingresos, Total gastos y Saldo.

#### Scenario: XLSX con hojas esperadas
- **WHEN** el usuario autenticado exporta a XLSX sus transacciones
- **THEN** el sistema responde un archivo XLSX válido con la hoja de transacciones y la hoja de resumen

### Requirement: Filtros aplicados a la exportación
El sistema DEBE aplicar a la exportación los mismos filtros del listado (`type`, `category`, `q`, `from`, `to`) con las mismas validaciones. Un formato distinto de `csv`, `pdf` o `xlsx` DEBE responder 400 con un mensaje en español. Los filtros inválidos DEBEN responder 400 con el mensaje correspondiente en español.

#### Scenario: Exportación filtrada por rango de fechas
- **WHEN** el usuario autenticado exporta con `from` y `to` válidos
- **THEN** el archivo generado contiene únicamente las transacciones dentro del rango indicado

#### Scenario: Formato no soportado rechazado
- **WHEN** el usuario autenticado solicita la exportación con `format=xml`
- **THEN** el sistema responde 400 con el mensaje de error en español

### Requirement: Protección y aislamiento de la exportación
El sistema DEBE exigir un token JWT válido para exportar. Sin token o con token inválido o expirado, el sistema DEBE responder el error de autenticación correspondiente en español. La exportación NUNCA DEBE incluir transacciones de otros usuarios.

#### Scenario: Exportación ajena excluida
- **WHEN** dos usuarios autenticados exportan sus transacciones
- **THEN** cada archivo contiene únicamente transacciones propias

### Requirement: Interfaz de exportación
La página de Transacciones DEBE ofrecer un botón `Exportar` con opciones `CSV`, `PDF` y `XLSX` en la sección Filtros. Al elegir un formato, el sistema DEBE descargar el archivo generado con los filtros activos aplicados e informar el resultado con toasts: éxito al completar la descarga y el mensaje de error devuelto por la API ante fallos. Los textos visibles DEBEN estar en español.

#### Scenario: Descarga desde la interfaz
- **WHEN** el usuario autenticado presiona `Exportar` y elige `CSV` con filtros activos
- **THEN** el navegador descarga un archivo CSV con las transacciones filtradas y se muestra un toast de éxito
