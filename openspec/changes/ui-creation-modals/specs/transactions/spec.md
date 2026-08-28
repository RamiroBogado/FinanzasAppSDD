## MODIFIED Requirements

### Requirement: Gestión de transacciones en la interfaz
La interfaz protegida DEBE estar organizada mediante una barra lateral de navegación con los accesos `Dashboard`, `Transacciones`, `Presupuestos` y `Alertas`, e identificar al usuario autenticado por su username en la barra lateral junto a `Cerrar sesión`. La página `Transacciones` DEBE permitir al usuario autenticado crear, editar y eliminar sus transacciones mediante un modal centrado con fondo difuminado que se abre al presionar `Agregar transacción` o `Editar` y se cierra con `Cancelar`, submit exitoso, click en el backdrop o `ESC`. El modal DEBE ofrecer la selección del tipo con las opciones `Ingreso` y `Gasto`, el monto, la fecha, la descripción y la categoría opcional con opciones sugeridas, con el botón `Agregar transacción` para creación y `Guardar cambios` para edición, mostrando el título `Nueva transacción` o `Editar transacción` según corresponda. El listado DEBE mostrar la fecha en formato `dd/mm/aaaa`, el monto con formato de moneda ARS (símbolo `$`, separador de miles y dos decimales), la descripción y la categoría cuando exista. El sistema DEBE mostrar los totales de ingresos y gastos y el saldo con formato ARS, recalculados sobre el resultado filtrado. La interfaz DEBE ofrecer filtros por categoría, texto en la descripción y rango de fechas, con el botón `Limpiar filtros` que DEBE restablecer los filtros manteniendo el alcance del período global seleccionado, y DEBE mostrar los gastos por categoría con formato ARS. Los textos visibles DEBEN estar en español.

#### Scenario: Alta desde la interfaz
- **WHEN** el usuario autenticado presiona `Agregar transacción`, completa el modal con tipo `Gasto`, monto, fecha, descripción y categoría `Comida` y presiona `Agregar transacción`
- **THEN** la transacción aparece en el listado con su categoría, fecha en formato `dd/mm/aaaa` y monto con formato ARS y el modal se cierra

#### Scenario: Edición desde la interfaz
- **WHEN** el usuario autenticado presiona `Editar` sobre una transacción, cambia su categoría en el modal y confirma con `Guardar cambios`
- **THEN** el listado refleja los datos modificados de la transacción y el modal se cierra

#### Scenario: Eliminación desde la interfaz
- **WHEN** el usuario autenticado elimina una transacción de su listado
- **THEN** la transacción desaparece del listado y los totales se recalculan

#### Scenario: Totales del listado
- **WHEN** el usuario autenticado visualiza su listado de transacciones sin filtros adicionales
- **THEN** el sistema muestra el total de ingresos, el total de gastos y el saldo calculados sobre las transacciones del período seleccionado con formato ARS

#### Scenario: Alcance del período
- **WHEN** el usuario autenticado cambia el mes o el año en el selector de período global
- **THEN** el listado y los totales muestran únicamente las transacciones del nuevo período

#### Scenario: Filtros desde la interfaz
- **WHEN** el usuario autenticado aplica un filtro de categoría o texto en la descripción sobre su listado
- **THEN** el listado y los totales reflejan únicamente las transacciones del período que cumplen el filtro

#### Scenario: Gastos por categoría
- **WHEN** el usuario autenticado visualiza su listado de transacciones
- **THEN** el sistema muestra el total de gastos de cada categoría presente en el período con formato ARS

#### Scenario: Limpiar filtros
- **WHEN** el usuario autenticado presiona `Limpiar filtros` habiendo aplicado filtros
- **THEN** el listado y los totales vuelven a mostrar las transacciones del período seleccionado sin filtros adicionales

#### Scenario: Acceso desde la navegación
- **WHEN** el usuario autenticado selecciona `Transacciones` en la barra lateral
- **THEN** el sistema muestra su gestión de transacciones e identifica al usuario por su username en la barra lateral

#### Scenario: Apertura del modal de transacción
- **WHEN** el usuario autenticado presiona `Agregar transacción`
- **THEN** el sistema abre un modal centrado con fondo difuminado y el formulario de transacción

#### Scenario: Cierre del modal de transacción por Cancelar
- **WHEN** el usuario tiene el modal de transacción abierto y presiona `Cancelar`
- **THEN** el sistema cierra el modal y no crea ni modifica ninguna transacción
