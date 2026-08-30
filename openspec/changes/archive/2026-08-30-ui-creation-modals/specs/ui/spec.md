## ADDED Requirements

### Requirement: Modal de creación y edición con fondo difuminado
La interfaz DEBE ofrecer los formularios de creación y edición de transacciones, presupuestos y metas de ahorro dentro de un modal centrado con fondo difuminado (`backdrop-blur`) idéntico al de categorías. Al presionar `Agregar transacción`, `Agregar presupuesto` o `Agregar meta`, el sistema DEBE abrir el modal con el formulario correspondiente y difuminar el fondo; al presionar `Cancelar`, confirmar el alta/edición, hacer click en el backdrop o presionar `ESC`, el sistema DEBE cerrar el modal y quitar el difuminado. Tanto la creación como la edición DEBEN usar el mismo modal con título dinámico (`Nueva ...` / `Editar ...`) y los mismos campos y validaciones que el formulario previo.

#### Scenario: Apertura del modal de transacción
- **WHEN** el usuario autenticado presiona `Agregar transacción` en la página Transacciones
- **THEN** el sistema abre un modal centrado con el formulario de transacción y muestra el fondo difuminado detrás

#### Scenario: Apertura del modal de presupuesto
- **WHEN** el usuario autenticado presiona `Agregar presupuesto` en la página Presupuestos
- **THEN** el sistema abre un modal centrado con el formulario de presupuesto y muestra el fondo difuminado detrás

#### Scenario: Apertura del modal de meta
- **WHEN** el usuario autenticado presiona `Agregar meta` en la página Metas
- **THEN** el sistema abre un modal centrado con el formulario de meta y muestra el fondo difuminado detrás

#### Scenario: Cierre del modal por Cancelar
- **WHEN** el usuario tiene abierto el modal de creación o edición y presiona `Cancelar`
- **THEN** el sistema cierra el modal y quita el fondo difuminado sin crear ni modificar datos

#### Scenario: Cierre del modal por backdrop o ESC
- **WHEN** el usuario tiene abierto el modal y hace click en el fondo difuminado o presiona `ESC`
- **THEN** el sistema cierra el modal y quita el fondo difuminado

#### Scenario: Edición también en modal
- **WHEN** el usuario autenticado presiona `Editar` sobre una transacción, presupuesto o meta existente
- **THEN** el sistema abre el mismo modal con los datos precargados y título `Editar ...` y fondo difuminado
