# transactions Specification

## Purpose
Permite a cada usuario registrar, consultar, modificar y eliminar sus ingresos y gastos personales, manteniendo el aislamiento total de los datos financieros según el usuario autenticado.

## Requirements

### Requirement: Creación de transacciones
El sistema DEBE permitir crear una transacción propia mediante `POST /api/transactions` con un token JWT válido. La transacción DEBE contener `type` (`income` o `expense`), `amount` (número entero positivo en centavos de ARS) y `date` en formato ISO `YYYY-MM-DD`; si `date` se omite, DEBE tomarse la fecha actual. La descripción DEBE ser opcional y no superar los 255 caracteres. La categoría DEBE ser opcional, ser texto de hasta 32 caracteres y normalizarse a nula cuando llega vacía. Los errores de validación DEBEN responder código 400 con mensajes en español.

#### Scenario: Alta exitosa de una transacción
- **WHEN** el usuario autenticado envía una transacción válida con tipo `expense`, monto positivo y fecha `2026-08-20`
- **THEN** el sistema crea la transacción y responde con sus datos, incluyendo tipo, monto, fecha y descripción

#### Scenario: Alta exitosa de una transacción con categoría
- **WHEN** el usuario autenticado envía una transacción válida con tipo `expense`, monto positivo, fecha `2026-08-20` y categoría `Comida`
- **THEN** el sistema crea la transacción y responde con sus datos, incluyendo tipo, monto, fecha, descripción y categoría

#### Scenario: Fecha por defecto
- **WHEN** el usuario autenticado crea una transacción sin indicar fecha
- **THEN** el sistema asigna la fecha actual del servidor en formato ISO `YYYY-MM-DD`

#### Scenario: Tipo inválido
- **WHEN** el usuario autenticado envía una transacción con un tipo distinto de `income` o `expense`
- **THEN** el sistema responde un error 400 en español indicando los tipos válidos

#### Scenario: Monto inválido
- **WHEN** el usuario autenticado envía una transacción con monto no positivo o que no es un número entero
- **THEN** el sistema responde un error 400 en español indicando el formato válido del monto

#### Scenario: Categoría demasiado larga
- **WHEN** el usuario autenticado envía una transacción con una categoría de más de 32 caracteres
- **THEN** el sistema responde un error 400 en español y la transacción no se crea

#### Scenario: Categoría vacía
- **WHEN** el usuario autenticado envía una transacción con la categoría vacía
- **THEN** el sistema crea la transacción sin categoría

### Requirement: Listado de transacciones propias
El sistema DEBE permitir listar las transacciones del usuario autenticado mediante `GET /api/transactions`, ordenadas por fecha descendente. El listado DEBE aceptar los parámetros opcionales combínales `type` (`income` o `expense`), `category` (coincidencia exacta sin distinguir mayúsculas), `q` (texto parcial en la descripción) y `from`/`to` (rango de fechas ISO inclusivo); si `from` o `to` no son fechas ISO válidas, el sistema DEBE responder 400 con un mensaje en español. El listado NUNCA DEBE incluir transacciones de otros usuarios.

#### Scenario: Listado completo
- **WHEN** el usuario autenticado consulta sus transacciones
- **THEN** el sistema responde únicamente las transacciones de ese usuario, ordenadas de la fecha más reciente a la más antigua

#### Scenario: Filtro por tipo
- **WHEN** el usuario autenticado consulta sus transacciones con el parámetro `type=expense`
- **THEN** el sistema responde únicamente las transacciones de gasto de ese usuario

#### Scenario: Filtro por categoría
- **WHEN** el usuario autenticado consulta sus transacciones con el parámetro `category=comida` y tiene transacciones con categoría `Comida`
- **THEN** el sistema responde únicamente las transacciones que coinciden con la categoría, sin distinguir mayúsculas

#### Scenario: Filtro por texto en la descripción
- **WHEN** el usuario autenticado consulta sus transacciones con el parámetro `q=super` y tiene transacciones cuya descripción contiene `super`
- **THEN** el sistema responde únicamente las transacciones cuya descripción contiene el texto, sin distinguir mayúsculas

#### Scenario: Filtro por rango de fechas
- **WHEN** el usuario autenticado consulta sus transacciones con `from=2026-08-01` y `to=2026-08-15`
- **THEN** el sistema responde únicamente las transacciones con fecha dentro del rango, incluyendo los extremos

#### Scenario: Rango de fechas inválido
- **WHEN** el usuario autenticado consulta sus transacciones con un parámetro `from` o `to` que no es una fecha ISO válida
- **THEN** el sistema responde un error 400 en español

#### Scenario: Filtros combinados
- **WHEN** el usuario autenticado consulta sus transacciones con varios filtros simultáneos
- **THEN** el sistema responde únicamente las transacciones que cumplen todos los filtros a la vez

#### Scenario: Aislamiento del listado
- **WHEN** un usuario autenticado tiene transacciones y otro usuario consulta las suyas con los mismos filtros
- **THEN** cada usuario recibe solo sus propias transacciones, sin datos del otro

### Requirement: Consulta individual de una transacción
El sistema DEBE permitir consultar una transacción propia mediante `GET /api/transactions/:id`. Si el id no existe o la transacción pertenece a otro usuario, el sistema DEBE responder 404 con un error en español, sin revelar la existencia de datos ajenos.

#### Scenario: Consulta de una transacción propia
- **WHEN** el usuario autenticado consulta el id de una transacción suya
- **THEN** el sistema responde los datos de esa transacción

#### Scenario: Consulta de una transacción de otro usuario
- **WHEN** el usuario autenticado consulta el id de una transacción que pertenece a otro usuario
- **THEN** el sistema responde 404 sin exponer información de la transacción

### Requirement: Actualización de transacciones
El sistema DEBE permitir modificar una transacción propia mediante `PUT /api/transactions/:id` con las mismas validaciones que la creación, incluida la categoría opcional de hasta 32 caracteres. Si la transacción no existe o pertenece a otro usuario, el sistema DEBE responder 404. La actualización NUNCA DEBE cambiar el dueño de la transacción.

#### Scenario: Edición exitosa
- **WHEN** el usuario autenticado modifica una transacción suya con datos válidos
- **THEN** el sistema actualiza la transacción y responde con sus nuevos datos

#### Scenario: Edición exitosa con categoría
- **WHEN** el usuario autenticado modifica una transacción suya con datos válidos e incluye una categoría
- **THEN** el sistema actualiza la transacción y responde con sus nuevos datos, incluida la categoría

#### Scenario: Edición con datos inválidos
- **WHEN** el usuario autenticado modifica una transacción suya con un monto no válido
- **THEN** el sistema responde un error 400 en español y la transacción no cambia

#### Scenario: Edición de una transacción ajena
- **WHEN** el usuario autenticado intenta modificar una transacción de otro usuario
- **THEN** el sistema responde 404 y la transacción no se modifica

### Requirement: Eliminación de transacciones
El sistema DEBE permitir eliminar una transacción propia mediante `DELETE /api/transactions/:id`. Si la transacción no existe o pertenece a otro usuario, el sistema DEBE responder 404. Una vez eliminada, la transacción NO DEBE aparecer en listados posteriores.

#### Scenario: Eliminación exitosa
- **WHEN** el usuario autenticado elimina una transacción suya
- **THEN** el sistema la elimina y deja de mostrarla en los listados

#### Scenario: Eliminación de una transacción ajena
- **WHEN** el usuario autenticado intenta eliminar una transacción de otro usuario
- **THEN** el sistema responde 404 y la transacción no se elimina

### Requirement: Protección de transacciones sin sesión
El sistema DEBE exigir un token JWT válido para cualquier operación sobre transacciones. Sin token o con token inválido o expirado, el sistema DEBE responder el error de autenticación correspondiente en español.

#### Scenario: Acceso sin token
- **WHEN** un usuario no autenticado envía una solicitud a cualquier endpoint de transacciones
- **THEN** el sistema responde el error de autenticación en español y no expone ningún dato

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

### Requirement: Validación de categoría existente
Al crear o actualizar una transacción mediante `POST /api/transactions` o `PUT /api/transactions/:id`, si la petición incluye el campo opcional `category` (string no vacío), el sistema DEBE verificar que exista una categoría con ese nombre exacto (case-insensitive) en el catálogo del usuario autenticado (`categories.name` donde `categories.user_id = current_user.id`). Si no existe, DEBE responder 400 con mensaje "La categoría no existe en tu catálogo". Si existe, DEBE proceder normalmente. El campo `category` sigue siendo opcional; si se omite o es string vacío, no se valida y se guarda como nulo.

#### Scenario: Transacción con categoría válida del catálogo
- **WHEN** el usuario autenticado crea transacción `{ "type": "expense", "amount": 150000, "date": "2026-08-27", "category": "Comida" }` existiendo "Comida" en su catálogo
- **THEN** el sistema crea la transacción y responde 201 con categoría incluida

#### Scenario: Transacción con categoría inexistente
- **WHEN** el usuario autenticado crea transacción con `"category": "Inexistente"` no estando en su catálogo
- **THEN** el sistema responde 400 con mensaje "La categoría no existe en tu catálogo"

#### Scenario: Transacción sin categoría
- **WHEN** el usuario autenticado crea transacción sin campo `category` o con `""`
- **THEN** el sistema crea la transacción normalmente (categoría nula)

#### Scenario: Categoría de otro usuario
- **WHEN** el usuario A crea transacción con `"category": "Comida"` donde "Comida" existe solo en catálogo del usuario B
- **THEN** el sistema responde 400 (no existe en catálogo de A)

