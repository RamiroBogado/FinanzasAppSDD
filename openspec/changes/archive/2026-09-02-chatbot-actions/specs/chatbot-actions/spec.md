## Purpose

Permite que el asistente financiero proponga y ejecute, tras confirmación, las acciones autenticadas disponibles sin exceder los permisos del usuario.

## Requirements

### Requirement: Propuestas seguras de acciones

El sistema MUST convertir una instrucción accionable completa en una propuesta de una sola acción, asociada al usuario autenticado y con un resumen en español. La propuesta MUST incluir únicamente operaciones soportadas sobre transacciones, categorías, presupuestos, metas, alertas o exportaciones. Si faltan datos o hay más de un recurso candidato, el sistema MUST solicitar aclaración y MUST NOT crear una propuesta ejecutable.

#### Scenario: Alta de transacción propuesta
- **WHEN** el usuario autenticado escribe una instrucción completa para registrar un gasto
- **THEN** el sistema devuelve una propuesta con el resumen de la transacción y las acciones `Confirmar` y `Cancelar`, sin crearla todavía

#### Scenario: Referencia ambigua
- **WHEN** el usuario pide eliminar una transacción y existen varias propias que coinciden con su descripción
- **THEN** el sistema solicita una aclaración y no elimina ni propone eliminar ninguna

### Requirement: Confirmación y ejecución aislada

El sistema MUST ejecutar una propuesta de escritura solo después de la confirmación explícita del usuario que la creó. La ejecución MUST reaplicar las validaciones y autorización de la operación REST equivalente, MUST estar limitada por `user_id`, y MUST registrar el resultado. Una confirmación repetida MUST NOT repetir la mutación.

#### Scenario: Confirmación de propuesta propia
- **WHEN** el usuario autenticado confirma una propuesta pendiente propia y válida
- **THEN** el sistema ejecuta la operación una vez y devuelve el resultado en español

#### Scenario: Confirmación ajena
- **WHEN** un usuario intenta confirmar el identificador de propuesta de otro usuario
- **THEN** el sistema responde 404 sin ejecutar ninguna operación

#### Scenario: Reintento de confirmación
- **WHEN** el usuario reintenta confirmar una propuesta ya confirmada
- **THEN** el sistema devuelve el resultado previamente registrado sin repetir la operación

### Requirement: Cancelación y vencimiento

El sistema MUST permitir cancelar una propuesta pendiente propia. Una propuesta vencida, cancelada o inexistente MUST NOT ejecutarse.

#### Scenario: Cancelación
- **WHEN** el usuario cancela una propuesta pendiente propia
- **THEN** el sistema marca la propuesta como cancelada y no modifica datos financieros
