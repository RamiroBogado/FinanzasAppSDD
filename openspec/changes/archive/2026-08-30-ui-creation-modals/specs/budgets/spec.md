## MODIFIED Requirements

### Requirement: Gestión de presupuestos en la interfaz
La interfaz protegida DEBE permitir al usuario autenticado gestionar sus presupuestos mensuales por categoría, accesible desde la barra lateral con el acceso `Presupuestos`. El listado DEBE mostrar los presupuestos del mes seleccionado mediante el selector de período global de la barra lateral. La creación y la edición DEBEN realizarse dentro de un modal centrado con fondo difuminado que se abre al presionar `Agregar presupuesto` o `Editar` y se cierra con `Cancelar`, submit exitoso, click en el backdrop o `ESC`. El modal DEBE ofrecer categoría, mes inicializado con el período global (no editable, definido por el selector del menú) y monto con el botón `Agregar presupuesto` para creación y `Guardar cambios` para edición, junto con un campo opcional de umbral numérico entre 1 y 100 cuyo valor inicial DEBE ser 80 y los títulos `Nuevo presupuesto` / `Editar presupuesto` según corresponda. El listado DEBE mostrar categoría, límite y total gastado con formato de moneda ARS (símbolo `$`, separador de miles y dos decimales), el progreso respecto del límite y las alertas `Presupuesto excedido` cuando el gasto supera el límite y de aviso de umbral alcanzado cuando el gasto alcanza el porcentaje configurado sin superarlo. Cada presupuesto DEBE ofrecer `Editar` y `Eliminar`. Los textos visibles DEBEN estar en español.

#### Scenario: Alta desde la interfaz
- **WHEN** el usuario autenticado presiona `Agregar presupuesto`, completa el modal con categoría `Comida`, mes, monto y umbral y presiona `Agregar presupuesto`
- **THEN** el presupuesto aparece en el listado del período con su límite y umbral en formato correspondiente y el modal se cierra

#### Scenario: Progreso del mes
- **WHEN** el usuario autenticado visualiza sus presupuestos del período seleccionado y tiene gastos en alguna categoría
- **THEN** el sistema muestra el total gastado de cada categoría junto al límite con formato ARS y el progreso correspondiente

#### Scenario: Presupuesto excedido
- **WHEN** el total gastado de una categoría supera el límite del presupuesto
- **THEN** el sistema muestra la alerta `Presupuesto excedido` para esa categoría

#### Scenario: Aviso al alcanzar el umbral
- **WHEN** el total gastado de una categoría alcanza el porcentaje de umbral configurado sin superar el límite
- **THEN** el sistema muestra el aviso de umbral alcanzado para esa categoría

#### Scenario: Cambio de período global
- **WHEN** el usuario autenticado cambia el mes o el año en el selector de período global
- **THEN** el listado muestra los presupuestos del período seleccionado

#### Scenario: Edición desde la interfaz
- **WHEN** el usuario autenticado presiona `Editar` sobre un presupuesto y confirma con `Guardar cambios` en el modal
- **THEN** el listado refleja el presupuesto modificado y el modal se cierra

#### Scenario: Eliminación desde la interfaz
- **WHEN** el usuario autenticado elimina un presupuesto de su listado
- **THEN** el presupuesto desaparece del listado del período

#### Scenario: Mes sin presupuestos
- **WHEN** el usuario autenticado selecciona un período sin presupuestos
- **THEN** el sistema muestra un mensaje de vacío en español

#### Scenario: Apertura del modal de presupuesto
- **WHEN** el usuario autenticado presiona `Agregar presupuesto`
- **THEN** el sistema abre un modal centrado con fondo difuminado y el formulario de presupuesto

#### Scenario: Cierre del modal de presupuesto por Cancelar
- **WHEN** el usuario tiene el modal de presupuesto abierto y presiona `Cancelar`
- **THEN** el sistema cierra el modal sin crear ni modificar ningún presupuesto
