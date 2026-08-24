# budgets Specification

## MODIFIED Requirements

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
