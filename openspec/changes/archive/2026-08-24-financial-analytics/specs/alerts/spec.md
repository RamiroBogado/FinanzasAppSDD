# alerts Specification

## Purpose

Notifica al usuario cuando sus presupuestos mensuales alcanzan el umbral configurado o superan el límite, mediante alertas persistentes por usuario con control de lectura, integradas en la navegación y el dashboard.

## ADDED Requirements

### Requirement: Verificación y generación de alertas
El sistema DEBE permitir verificar los presupuestos del usuario autenticado mediante `POST /api/alerts/check` con un token JWT válido. La petición DEBE aceptar un campo opcional `month` en formato `AAAA-MM`; si se omite DEBE usarse el mes actual, y si tiene un formato inválido el sistema DEBE responder 400 con un mensaje en español. Para cada presupuesto del mes indicado, el sistema DEBE crear una alerta de tipo `danger` cuando el total gastado supera el límite, o de tipo `warning` cuando el total gastado alcanza el porcentaje de umbral del presupuesto sin superarlo; si corresponde `danger`, NO DEBE crearse la alerta de `warning`. El sistema NO DEBE crear una alerta duplicada para la misma combinación de usuario, categoría, mes y tipo. Los mensajes DEBEN estar en español e incluir la categoría y los montos con formato de moneda ARS.

#### Scenario: Generación de alerta de advertencia
- **WHEN** el usuario autenticado verifica sus presupuestos y uno tiene gastado exactamente el porcentaje de umbral configurado sin superar el límite
- **THEN** el sistema crea una alerta de tipo `warning` para esa categoría y mes

#### Scenario: Generación de alerta de límite superado
- **WHEN** el usuario autenticado verifica sus presupuestos y el total gastado de uno supera su límite
- **THEN** el sistema crea una alerta de tipo `danger` para esa categoría y mes

#### Scenario: Verificación repetida sin duplicados
- **WHEN** el usuario autenticado verifica dos veces los presupuestos de un mismo mes sin cambios en los datos
- **THEN** el sistema no crea alertas nuevas para las combinaciones ya existentes

#### Scenario: Mes con formato inválido
- **WHEN** el usuario autenticado envía una verificación con `month` que no cumple el formato `AAAA-MM`
- **THEN** el sistema responde un error 400 en español y no evalúa ningún presupuesto

### Requirement: Listado propio y aislamiento de alertas
El sistema DEBE permitir listar las alertas del usuario autenticado mediante `GET /api/alerts`, ordenadas por fecha de creación descendente hasta un máximo de 50. El listado NUNCA DEBE incluir alertas de otros usuarios.

#### Scenario: Listado propio
- **WHEN** el usuario autenticado consulta sus alertas
- **THEN** el sistema responde sus alertas ordenadas de la más reciente a la más antigua, incluyendo tipo, mensaje, estado de lectura y fecha de creación

#### Scenario: Aislamiento del listado
- **WHEN** dos usuarios autenticados tienen alertas propias y consultan sus listados
- **THEN** cada usuario recibe únicamente sus propias alertas, sin datos del otro

### Requirement: Control de lectura de alertas
El sistema DEBE permitir marcar como leída una alerta propia mediante `PUT /api/alerts/:id/read` y marcar todas las alertas propias como leídas mediante `POST /api/alerts/read-all`. Si el id no existe o la alerta pertenece a otro usuario, el sistema DEBE responder 404 con un error en español, sin revelar la existencia de datos ajenos.

#### Scenario: Marcar una alerta como leída
- **WHEN** el usuario autenticado marca como leída una alerta propia
- **THEN** el sistema actualiza su estado de lectura y deja de contarla como no leída

#### Scenario: Marcar todas como leídas
- **WHEN** el usuario autenticado marca todas sus alertas como leídas
- **THEN** el sistema actualiza el estado de todas sus alertas pendientes y ninguna queda como no leída

#### Scenario: Alerta ajena o inexistente
- **WHEN** el usuario autenticado intenta marcar como leída una alerta que pertenece a otro usuario o no existe
- **THEN** el sistema responde 404 sin exponer información de la alerta

### Requirement: Protección de alertas sin sesión
El sistema DEBE exigir un token JWT válido para cualquier operación sobre alertas. Sin token o con token inválido o expirado, el sistema DEBE responder el error de autenticación correspondiente en español.

#### Scenario: Acceso sin token
- **WHEN** un usuario no autenticado envía una solicitud a cualquier endpoint de alertas
- **THEN** el sistema responde el error de autenticación en español y no expone ningún dato

### Requirement: Alertas en la interfaz
La interfaz protegida DEBE ofrecer un acceso `Alertas` en la barra lateral con un badge que indique la cantidad de alertas no leídas, una página de alertas que liste el tipo, el mensaje y la fecha de cada alerta con las acciones `Marcar leída` y `Marcar todas`, y un banner en el Dashboard que resuma las alertas no leídas con acceso directo a la página de alertas. El sistema DEBE verificar los presupuestos del período seleccionado al visualizar el Dashboard y tras registrar, modificar o eliminar una transacción. Los textos visibles DEBEN estar en español.

#### Scenario: Página de alertas
- **WHEN** el usuario autenticado accede a la página `Alertas` con alertas pendientes
- **THEN** el sistema lista sus alertas con tipo, mensaje y fecha, y permite marcarlas como leídas individualmente o todas juntas

#### Scenario: Badge de no leídas
- **WHEN** el usuario autenticado tiene alertas no leídas y visualiza la barra lateral
- **THEN** el acceso `Alertas` muestra un badge con la cantidad de alertas no leídas, que desaparece al no quedar pendientes

#### Scenario: Banner en el dashboard
- **WHEN** el usuario autenticado ingresa al Dashboard teniendo alertas no leídas
- **THEN** el sistema muestra un banner resumen con acceso directo a la página de alertas

#### Scenario: Verificación tras registrar un gasto
- **WHEN** el usuario autenticado registra, modifica o elimina una transacción y luego visualiza el Dashboard del período
- **THEN** el sistema verifica los presupuestos del período y genera las alertas que correspondan según umbrales y límites vigentes
