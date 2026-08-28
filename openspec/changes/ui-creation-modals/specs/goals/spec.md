## MODIFIED Requirements

### Requirement: Interfaz de metas de ahorro
La interfaz protegida DEBE ofrecer la gestión de metas accesible desde la barra lateral con el acceso `Metas`. La creación y la edición DEBEN realizarse dentro de un modal centrado con fondo difuminado que se abre al presionar `Agregar meta` o `Editar` y se cierra con `Cancelar`, submit exitoso, click en el backdrop o `ESC`. El modal DEBE ofrecer nombre, monto objetivo, monto ahorrado inicial opcional y fecha límite opcional con el botón `Agregar meta` para creación y `Guardar cambios` para edición y los títulos `Nueva meta` / `Editar meta` según corresponda. El listado DEBE mostrar cada meta con nombre, ahorrado y objetivo con formato de moneda ARS (símbolo `$`, separador de miles y dos decimales), barra de progreso, badge `¡Meta cumplida!` cuando el ahorrado alcanza o supera el objetivo, y chip de fecha límite cuando exista. Cada meta DEBE ofrecer `Aportar`, `Retirar`, `Editar` y `Eliminar`, y la eliminación DEBE pedir confirmación con `¿Eliminar esta meta?` y acciones `Eliminar`/`Cancelar`. La página DEBE mostrar skeletons durante la carga y el estado vacío `Aún no tenés metas de ahorro`. Las operaciones DEBEN informar su resultado con toasts: `Meta creada`, `Meta actualizada`, `Meta eliminada`, `Aporte registrado` y `Retiro registrado`; los fallos DEBEN mostrar el mensaje de error devuelto por la API. Los textos visibles DEBEN estar en español.

#### Scenario: Alta desde la interfaz
- **WHEN** el usuario autenticado presiona `Agregar meta`, completa el modal con nombre y monto objetivo y presiona `Agregar meta`
- **THEN** el sistema muestra la meta en el listado con su progreso, cierra el modal y muestra el toast `Meta creada`

#### Scenario: Eliminación confirmada desde la interfaz
- **WHEN** el usuario autenticado confirma `Eliminar` en el diálogo `¿Eliminar esta meta?`
- **THEN** el sistema elimina la meta, actualiza el listado y muestra el toast `Meta eliminada`

#### Scenario: Apertura del modal de meta
- **WHEN** el usuario autenticado presiona `Agregar meta`
- **THEN** el sistema abre un modal centrado con fondo difuminado y el formulario de meta

#### Scenario: Cierre del modal de meta por Cancelar
- **WHEN** el usuario tiene el modal de meta abierto y presiona `Cancelar`
- **THEN** el sistema cierra el modal sin crear ni modificar ninguna meta

#### Scenario: Edición de meta en modal
- **WHEN** el usuario autenticado presiona `Editar` sobre una meta existente
- **THEN** el sistema abre el modal con los datos precargados y el título `Editar meta` y el fondo difuminado
