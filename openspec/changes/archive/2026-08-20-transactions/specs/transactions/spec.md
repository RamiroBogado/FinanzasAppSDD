## Purpose

Permite a cada usuario registrar, consultar, modificar y eliminar sus ingresos y gastos personales, manteniendo el aislamiento total de los datos financieros según el usuario autenticado.

## ADDED Requirements

### Requirement: Creación de transacciones
El sistema DEBE permitir crear una transacción propia mediante `POST /api/transactions` con un token JWT válido. La transacción DEBE contener `type` (`income` o `expense`), `amount` (número entero positivo en centavos de ARS) y `date` en formato ISO `YYYY-MM-DD`; si `date` se omite, DEBE tomarse la fecha actual. La descripción DEBE ser opcional y no superar los 255 caracteres. Los errores de validación DEBEN responder código 400 con mensajes en español.

#### Scenario: Alta exitosa de una transacción
- **WHEN** el usuario autenticado envía una transacción válida con tipo `expense`, monto positivo y fecha `2026-08-20`
- **THEN** el sistema crea la transacción y responde con sus datos, incluyendo tipo, monto, fecha y descripción

#### Scenario: Fecha por defecto
- **WHEN** el usuario autenticado crea una transacción sin indicar fecha
- **THEN** el sistema asigna la fecha actual del servidor en formato ISO `YYYY-MM-DD`

#### Scenario: Tipo inválido
- **WHEN** el usuario autenticado envía una transacción con un tipo distinto de `income` o `expense`
- **THEN** el sistema responde un error 400 en español indicando los tipos válidos

#### Scenario: Monto inválido
- **WHEN** el usuario autenticado envía una transacción con monto no positivo o que no es un número entero
- **THEN** el sistema responde un error 400 en español indicando el formato válido del monto

### Requirement: Listado de transacciones propias
El sistema DEBE permitir listar las transacciones del usuario autenticado mediante `GET /api/transactions`, ordenadas por fecha descendente, y DEBE aceptar el parámetro opcional `type` para filtrar solo `income` o `expense`. El listado NUNCA DEBE incluir transacciones de otros usuarios.

#### Scenario: Listado completo
- **WHEN** el usuario autenticado consulta sus transacciones
- **THEN** el sistema responde únicamente las transacciones de ese usuario, ordenadas de la fecha más reciente a la más antigua

#### Scenario: Filtro por tipo
- **WHEN** el usuario autenticado consulta sus transacciones con el parámetro `type=expense`
- **THEN** el sistema responde únicamente las transacciones de gasto de ese usuario

#### Scenario: Aislamiento del listado
- **WHEN** un usuario autenticado tiene transacciones y otro usuario consulta las suyas
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
El sistema DEBE permitir modificar una transacción propia mediante `PUT /api/transactions/:id` con las mismas validaciones que la creación. Si la transacción no existe o pertenece a otro usuario, el sistema DEBE responder 404. La actualización NUNCA DEBE cambiar el dueño de la transacción.

#### Scenario: Edición exitosa
- **WHEN** el usuario autenticado modifica una transacción suya con datos válidos
- **THEN** el sistema actualiza la transacción y responde con sus nuevos datos

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
La interfaz protegida DEBE permitir al usuario autenticado crear, editar y eliminar sus transacciones, identificadas por su username. El formulario DEBE ofrecer la selección del tipo con las opciones `Ingreso` y `Gasto`, el monto, la fecha y la descripción, con el botón `Agregar transacción`. El listado DEBE mostrar la fecha en formato `dd/mm/aaaa`, el monto con formato de moneda ARS (símbolo `$`, separador de miles y dos decimales) y la descripción, y DEBE mostrar los totales de ingresos y gastos y el saldo. Los textos visibles DEBEN estar en español.

#### Scenario: Alta desde la interfaz
- **WHEN** el usuario autenticado completa el formulario con tipo `Gasto`, monto, fecha y descripción y presiona `Agregar transacción`
- **THEN** la transacción aparece en el listado con fecha en formato `dd/mm/aaaa` y monto con formato ARS

#### Scenario: Edición desde la interfaz
- **WHEN** el usuario autenticado edita una transacción de su listado y confirma los cambios
- **THEN** el listado refleja los datos modificados de la transacción

#### Scenario: Eliminación desde la interfaz
- **WHEN** el usuario autenticado elimina una transacción de su listado
- **THEN** la transacción desaparece del listado y los totales se recalculan

#### Scenario: Totales del listado
- **WHEN** el usuario autenticado visualiza su listado de transacciones
- **THEN** el sistema muestra el total de ingresos, el total de gastos y el saldo calculados sobre sus transacciones con formato ARS