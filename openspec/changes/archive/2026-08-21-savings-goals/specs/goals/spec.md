# goals Specification

## Purpose

Permite que cada usuario fije metas de ahorro propias con un monto objetivo, el dinero acumulado y una fecha límite opcional, y que gestione aportaciones y retiros sobre ellas con progreso visual en la interfaz.

## ADDED Requirements

### Requirement: Creación de metas de ahorro
El sistema DEBE permitir crear una meta propia mediante `POST /api/goals` con un token JWT válido. La meta DEBE contener `name` (texto obligatorio recortado de hasta 80 caracteres) y `targetAmount` (número entero positivo en centavos de ARS), y DEBE aceptar opcionalmente `savedAmount` (entero no negativo en centavos, cero por defecto) y `deadline` (fecha ISO `YYYY-MM-DD` o nula). Los errores de validación DEBEN responder 400 con mensajes en español.

#### Scenario: Alta válida completa
- **WHEN** el usuario autenticado envía nombre `Vacaciones`, `targetAmount` positivo, `savedAmount` válido y `deadline` ISO
- **THEN** el sistema crea la meta propia y responde 201 con sus datos incluyendo `id`

#### Scenario: Validación de campos inválidos
- **WHEN** el usuario autenticado envía un nombre vacío o mayor a 80 caracteres, un monto que no es entero positivo, un ahorrado negativo o una fecha límite que no es ISO `YYYY-MM-DD`
- **THEN** el sistema responde 400 con el mensaje de error correspondiente en español

### Requirement: Listado de metas de ahorro
El sistema DEBE permitir listar las metas del usuario autenticado mediante `GET /api/goals`, ordenadas por fecha de creación descendente. El listado NUNCA DEBE incluir metas de otros usuarios.

#### Scenario: Listado propio
- **WHEN** el usuario autenticado consulta sus metas habiendo creado varias
- **THEN** el sistema las responde ordenadas desde la más reciente

#### Scenario: Aislamiento del listado
- **WHEN** dos usuarios autenticados consultan sus metas
- **THEN** cada usuario recibe únicamente sus propias metas

### Requirement: Consulta de una meta
El sistema DEBE permitir consultar una meta propia mediante `GET /api/goals/:id`. Si el id no existe o la meta pertenece a otro usuario, el sistema DEBE responder 404 con un error en español, sin revelar la existencia de datos ajenos.

#### Scenario: Consulta ajena rechazada
- **WHEN** el usuario autenticado consulta el id de una meta de otro usuario
- **THEN** el sistema responde 404 sin exponer los datos

### Requirement: Actualización de metas
El sistema DEBE permitir modificar una meta propia mediante `PUT /api/goals/:id` con las mismas validaciones que la creación. Si la meta no existe o pertenece a otro usuario, el sistema DEBE responder 404. La actualización NUNCA DEBE cambiar el dueño de la meta.

#### Scenario: Edición propia
- **WHEN** el usuario autenticado modifica nombre, montos o fecha límite de su meta
- **THEN** el sistema responde la meta actualizada

### Requirement: Eliminación de metas
El sistema DEBE permitir eliminar una meta propia mediante `DELETE /api/goals/:id`. Si la meta no existe o pertenece a otro usuario, el sistema DEBE responder 404. Una vez eliminada, la meta NO DEBE aparecer en listados posteriores.

#### Scenario: Baja exitosa
- **WHEN** el usuario autenticado elimina su meta
- **THEN** el sistema responde 204 y la meta desaparece del listado

### Requirement: Protección y aislamiento de metas
El sistema DEBE exigir un token JWT válido para cualquier operación sobre metas. Sin token o con token inválido o expirado, el sistema DEBE responder el error de autenticación correspondiente en español. Toda operación DEBE filtrar por el usuario autenticado.

#### Scenario: Acceso sin token
- **WHEN** se invoca cualquier endpoint de metas sin token
- **THEN** el sistema responde el error de autenticación en español

### Requirement: Interfaz de metas de ahorro
La interfaz protegida DEBE ofrecer la gestión de metas accesible desde la barra lateral con el acceso `Metas`. La página DEBE ofrecer un formulario de alta con nombre, monto objetivo, monto ahorrado inicial opcional y fecha límite opcional con el botón `Agregar meta`; la edición DEBE reutilizar el formulario con `Guardar cambios` y `Cancelar`. El listado DEBE mostrar cada meta con nombre, ahorrado y objetivo con formato de moneda ARS (símbolo `$`, separador de miles y dos decimales), barra de progreso, badge `¡Meta cumplida!` cuando el ahorrado alcanza o supera el objetivo, y chip de fecha límite cuando exista. Cada meta DEBE ofrecer `Aportar`, `Retirar`, `Editar` y `Eliminar`, y la eliminación DEBE pedir confirmación con `¿Eliminar esta meta?` y acciones `Eliminar`/`Cancelar`. La página DEBE mostrar skeletons durante la carga y el estado vacío `Aún no tenés metas de ahorro`. Las operaciones DEBEN informar su resultado con toasts: `Meta creada`, `Meta actualizada`, `Meta eliminada`, `Aporte registrado` y `Retiro registrado`; los fallos DEBEN mostrar el mensaje de error devuelto por la API. Los textos visibles DEBEN estar en español.

#### Scenario: Alta desde la interfaz
- **WHEN** el usuario autenticado completa el formulario con nombre y monto objetivo y presiona `Agregar meta`
- **THEN** el sistema muestra la meta en el listado con su progreso y el toast `Meta creada`

#### Scenario: Eliminación confirmada desde la interfaz
- **WHEN** el usuario autenticado confirma `Eliminar` en el diálogo `¿Eliminar esta meta?`
- **THEN** el sistema elimina la meta, actualiza el listado y muestra el toast `Meta eliminada`

### Requirement: Aportes y retiros sobre metas
La interfaz DEBE permitir registrar aportes y retiros sobre una meta propia mediante diálogos con ingreso de monto. Un aporte DEBE sumar al monto ahorrado; un retiro DEBE restar SIN dejar el ahorrado por debajo de cero, rechazando con mensaje en español un retiro mayor al ahorrado. Ambas operaciones DEBEN persistirse mediante la actualización de la meta e informarse con los toasts `Aporte registrado` y `Retiro registrado`.

#### Scenario: Aporte registrado
- **WHEN** el usuario autenticado aporta un monto válido sobre su meta con botón `Aportar`
- **THEN** el sistema incrementa el ahorrado, actualiza el progreso y muestra el toast `Aporte registrado`

#### Scenario: Retiro limitado al ahorrado
- **WHEN** el usuario autenticado intenta retirar más de lo ahorrado con el botón `Retirar`
- **THEN** el sistema rechaza la operación con un mensaje en español sin modificar la meta
