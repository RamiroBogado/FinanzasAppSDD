# budgets Specification

## Purpose
Permite a cada usuario definir un límite mensual de gasto por categoría y conocer cuánto lleva gastado en el período, manteniendo el aislamiento total de los datos por usuario.

## Requirements

### Requirement: Creación de presupuestos
El sistema DEBE permitir crear un presupuesto propio mediante `POST /api/budgets` con un token JWT válido. El presupuesto DEBE contener `category` (texto obligatorio recortado de hasta 32 caracteres), `month` en formato `AAAA-MM` y `amount` (número entero positivo en centavos de ARS). DEBE aceptar un campo opcional `threshold` como número entero entre 1 y 100 que represente el porcentaje de umbral de aviso; si se omite, DEBE tomarse 80, y si es inválido el sistema DEBE responder 400 con un mensaje en español. Los demás errores de validación DEBEN responder código 400 con mensajes en español. Si ya existe un presupuesto para la misma categoría y mes, el sistema DEBE responder 409 con un mensaje en español, sin distinguir mayúsculas en la categoría.

#### Scenario: Alta exitosa de un presupuesto
- **WHEN** el usuario autenticado envía un presupuesto válido con categoría `Comida`, mes `2026-08` y monto positivo
- **THEN** el sistema crea el presupuesto y responde con sus datos, incluyendo categoría, mes y monto

#### Scenario: Categoría vacía
- **WHEN** el usuario autenticado envía un presupuesto sin categoría o con categoría vacía
- **THEN** el sistema responde un error 400 en español indicando que la categoría es obligatoria

#### Scenario: Mes inválido
- **WHEN** el usuario autenticado envía un presupuesto con un mes que no tiene formato `AAAA-MM`
- **THEN** el sistema responde un error 400 en español indicando el formato válido del mes

#### Scenario: Monto inválido
- **WHEN** el usuario autenticado envía un presupuesto con monto no positivo o que no es un número entero
- **THEN** el sistema responde un error 400 en español indicando el formato válido del monto

#### Scenario: Umbral por defecto
- **WHEN** el usuario autenticado crea un presupuesto válido sin indicar `threshold`
- **THEN** el sistema lo crea con umbral 80

#### Scenario: Umbral inválido
- **WHEN** el usuario autenticado crea un presupuesto con `threshold` que no es un entero entre 1 y 100
- **THEN** el sistema responde un error 400 en español indicando el rango válido del umbral

#### Scenario: Presupuesto duplicado
- **WHEN** el usuario autenticado envía un presupuesto para una categoría y mes que ya tienen un presupuesto
- **THEN** el sistema responde un error 409 en español y no crea el presupuesto

### Requirement: Listado de presupuestos propios
El sistema DEBE permitir listar los presupuestos del usuario autenticado mediante `GET /api/budgets` e incluir en cada uno `spent`, la suma de los gastos propios del mismo mes y categoría (sin distinguir mayúsculas), y `threshold`, el porcentaje de umbral configurado. El listado DEBE aceptar los parámetros opcionales `month` (validado con formato `AAAA-MM`, error 400 en caso contrario) y `category`. El listado NUNCA DEBE incluir presupuestos de otros usuarios.

#### Scenario: Listado con total gastado
- **WHEN** el usuario autenticado consulta sus presupuestos y tiene gastos en la misma categoría y mes de uno de ellos
- **THEN** el sistema responde cada presupuesto con su límite, su umbral y el total `spent` correspondiente en centavos

#### Scenario: Filtro por mes
- **WHEN** el usuario autenticado consulta sus presupuestos con el parámetro `month=2026-08`
- **THEN** el sistema responde únicamente los presupuestos de ese mes

#### Scenario: Mes inválido en el filtro
- **WHEN** el usuario autenticado consulta sus presupuestos con un parámetro `month` inválido
- **THEN** el sistema responde un error 400 en español

#### Scenario: Presupuesto sin gastos
- **WHEN** el usuario autenticado consulta un presupuesto cuyo mes y categoría no tienen gastos
- **THEN** el sistema responde ese presupuesto con `spent` igual a cero

#### Scenario: Aislamiento del listado
- **WHEN** un usuario autenticado tiene presupuestos y otro usuario consulta los suyos
- **THEN** cada usuario recibe solo sus propios presupuestos, sin datos del otro

### Requirement: Consulta individual de un presupuesto
El sistema DEBE permitir consultar un presupuesto propio mediante `GET /api/budgets/:id`, incluyendo el total `spent` del período. Si el id no existe o el presupuesto pertenece a otro usuario, el sistema DEBE responder 404 con un error en español, sin revelar la existencia de datos ajenos.

#### Scenario: Consulta de un presupuesto propio
- **WHEN** el usuario autenticado consulta el id de un presupuesto suyo
- **THEN** el sistema responde los datos del presupuesto con su total gastado

#### Scenario: Consulta de un presupuesto ajeno
- **WHEN** el usuario autenticado consulta el id de un presupuesto que pertenece a otro usuario
- **THEN** el sistema responde 404 sin exponer información del presupuesto

### Requirement: Actualización de presupuestos
El sistema DEBE permitir modificar un presupuesto propio mediante `PUT /api/budgets/:id` con las mismas validaciones que la creación, incluido `threshold` opcional entero entre 1 y 100; si se omite, DEBE conservarse el umbral existente, y si es inválido el sistema DEBE responder 400. Si el presupuesto no existe o pertenece a otro usuario, el sistema DEBE responder 404. Si la actualización genera una duplicación de categoría y mes con otro presupuesto, el sistema DEBE responder 409. La actualización NUNCA DEBE cambiar el dueño del presupuesto.

#### Scenario: Edición exitosa
- **WHEN** el usuario autenticado modifica un presupuesto suyo con datos válidos
- **THEN** el sistema actualiza el presupuesto y responde con sus nuevos datos

#### Scenario: Edición conservando el umbral
- **WHEN** el usuario autenticado modifica un presupuesto suyo sin indicar `threshold`
- **THEN** el presupuesto conserva el umbral que tenía antes de la edición

#### Scenario: Edición con umbral inválido
- **WHEN** el usuario autenticado modifica un presupuesto suyo con un `threshold` que no es un entero entre 1 y 100
- **THEN** el sistema responde un error 400 en español y el presupuesto no cambia

#### Scenario: Edición con presupuesto duplicado
- **WHEN** el usuario autenticado modifica un presupuesto suyo y el cambio genera duplicación con otro presupuesto suyo
- **THEN** el sistema responde un error 409 en español y el presupuesto no cambia

#### Scenario: Edición de un presupuesto ajeno
- **WHEN** el usuario autenticado intenta modificar un presupuesto de otro usuario
- **THEN** el sistema responde 404 y el presupuesto no se modifica

### Requirement: Eliminación de presupuestos
El sistema DEBE permitir eliminar un presupuesto propio mediante `DELETE /api/budgets/:id`. Si el presupuesto no existe o pertenece a otro usuario, el sistema DEBE responder 404. Una vez eliminado, el presupuesto NO DEBE aparecer en listados posteriores.

#### Scenario: Eliminación exitosa
- **WHEN** el usuario autenticado elimina un presupuesto suyo
- **THEN** el sistema lo elimina y deja de mostrarlo en los listados

#### Scenario: Eliminación de un presupuesto ajeno
- **WHEN** el usuario autenticado intenta eliminar un presupuesto de otro usuario
- **THEN** el sistema responde 404 y el presupuesto no se elimina

### Requirement: Protección de presupuestos sin sesión
El sistema DEBE exigir un token JWT válido para cualquier operación sobre presupuestos. Sin token o con token inválido o expirado, el sistema DEBE responder el error de autenticación correspondiente en español.

#### Scenario: Acceso sin token
- **WHEN** un usuario no autenticado envía una solicitud a cualquier endpoint de presupuestos
- **THEN** el sistema responde el error de autenticación en español y no expone ningún dato

### Requirement: Gestión de presupuestos en la interfaz
La interfaz protegida DEBE permitir al usuario autenticado gestionar sus presupuestos mensuales por categoría, accesible desde la barra lateral con el acceso `Presupuestos`. El listado DEBE mostrar los presupuestos del mes seleccionado mediante el selector de período global de la barra lateral. El formulario de alta DEBE ofrecer categoría, mes inicializado con el período global seleccionable y monto con el botón `Agregar presupuesto`, junto con un campo opcional de umbral numérico entre 1 y 100 cuyo valor inicial DEBE ser 80. El listado DEBE mostrar categoría, límite y total gastado con formato de moneda ARS (símbolo `$`, separador de miles y dos decimales), el progreso respecto del límite y las alertas `Presupuesto excedido` cuando el gasto supera el límite y de aviso de umbral alcanzado cuando el gasto alcanza el porcentaje configurado sin superarlo. La edición DEBE reutilizar el formulario con `Guardar cambios` y `Cancelar`, y cada presupuesto DEBE ofrecer `Editar` y `Eliminar`. Los textos visibles DEBEN estar en español.

#### Scenario: Alta desde la interfaz
- **WHEN** el usuario autenticado completa el formulario con categoría `Comida`, mes, monto y umbral y presiona `Agregar presupuesto`
- **THEN** el presupuesto aparece en el listado del período con su límite y umbral en formato correspondiente

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
- **WHEN** el usuario autenticado edita un presupuesto de su listado y confirma los cambios
- **THEN** el listado refleja el presupuesto modificado

#### Scenario: Eliminación desde la interfaz
- **WHEN** el usuario autenticado elimina un presupuesto de su listado
- **THEN** el presupuesto desaparece del listado del período

#### Scenario: Mes sin presupuestos
- **WHEN** el usuario autenticado selecciona un período sin presupuestos
- **THEN** el sistema muestra un mensaje de vacío en español

### Requirement: Validación de categoría existente
Al crear o actualizar un presupuesto mediante `POST /api/budgets` o `PUT /api/budgets/:id`, si la petición incluye el campo opcional `category` (string no vacío), el sistema DEBE verificar que exista una categoría con ese nombre exacto (case-insensitive) en el catálogo del usuario autenticado (`categories.name` donde `categories.user_id = current_user.id` y `categories.type = 'expense'` — los presupuestos solo aplican a gastos). Si no existe o no es de tipo gasto, DEBE responder 400 con mensaje "La categoría no existe en tu catálogo o no es de tipo gasto". Si existe y es tipo `expense`, DEBE proceder normalmente. El campo `category` sigue siendo opcional; si se omite o es string vacío, el presupuesto aplica a todos los gastos (comportamiento actual).

#### Scenario: Presupuesto con categoría válida de gasto
- **WHEN** el usuario autenticado crea presupuesto `{ "amount": 5000000, "period": "2026-08", "category": "Comida" }` existiendo "Comida" tipo expense en su catálogo
- **THEN** el sistema crea el presupuesto y responde 201 con categoría incluida

#### Scenario: Presupuesto con categoría inexistente
- **WHEN** el usuario autenticado crea presupuesto con `"category": "Inexistente"` no estando en su catálogo
- **THEN** el sistema responde 400 con mensaje "La categoría no existe en tu catálogo o no es de tipo gasto"

#### Scenario: Presupuesto con categoría de tipo income
- **WHEN** el usuario autenticado crea presupuesto con `"category": "Sueldo"` existiendo "Sueldo" tipo income en su catálogo
- **THEN** el sistema responde 400 con mensaje "La categoría no existe en tu catálogo o no es de tipo gasto"

#### Scenario: Presupuesto sin categoría (global)
- **WHEN** el usuario autenticado crea presupuesto sin campo `category` o con `""`
- **THEN** el sistema crea el presupuesto normalmente (aplica a todos los gastos)

#### Scenario: Categoría de otro usuario
- **WHEN** el usuario A crea presupuesto con `"category": "Comida"` donde "Comida" existe solo en catálogo del usuario B
- **THEN** el sistema responde 400 (no existe en catálogo de A)
