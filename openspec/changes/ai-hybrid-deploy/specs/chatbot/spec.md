# Delta for chatbot

## ADDED Requirements

### Requirement: Fuente de lectura Turso en solo-lectura

El servicio de IA MUST leer las transacciones, los presupuestos y las metas desde Turso en modo solo-lectura, con las mismas consultas filtradas por `user_id` que la lectura local actual sobre las tablas `transactions`, `budgets` y `goals`, incluyendo el cálculo de gasto por mes y categoría y la huella de conteos para decidir la re-indexación. Todas las consultas MUST filtrar por el usuario autenticado y MUST NOT devolver datos de otro usuario. El contrato de `POST /ai/chatbot/message` y `POST /ai/chatbot/clear` MUST permanecer sin cambios.

#### Scenario: Respuesta con datos de Turso del usuario

- **WHEN** el usuario autenticado pregunta por sus finanzas con datos registrados en Turso
- **THEN** la respuesta se basa en las transacciones, presupuestos y metas de ese usuario leídos desde Turso

#### Scenario: Aislamiento entre usuarios en Turso

- **WHEN** dos usuarios autenticados preguntan por sus movimientos con datos distintos en Turso
- **THEN** cada respuesta usa únicamente los datos propios y ninguna incluye datos del otro usuario

#### Scenario: Limpieza mantiene contrato

- **WHEN** el usuario autenticado invoca `POST /ai/chatbot/clear`
- **THEN** el servicio responde éxito y una consulta posterior se re-indexa desde los datos vigentes en Turso
