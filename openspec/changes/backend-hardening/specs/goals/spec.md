## MODIFIED Requirements

### Requirement: Listado de metas de ahorro
El sistema DEBE permitir listar las metas del usuario autenticado mediante `GET /api/goals`, ordenadas por fecha de creación descendente. El listado DEBE aceptar parámetros opcionales `limit` (default 50, max 200) y `offset` (default 0). La respuesta DEBE ser `{ data: Goal[], total: number, limit: number, offset: number }`. El listado NUNCA DEBE incluir metas de otros usuarios.

#### Scenario: Listado paginado
- **WHEN** el usuario autenticado consulta `GET /api/goals?limit=10&offset=0`
- **THEN** el sistema responde `{ data: [...], total: 25, limit: 10, offset: 0 }`

#### Scenario: Paginación página posterior
- **WHEN** el usuario autenticado consulta `GET /api/goals?limit=10&offset=20`
- **THEN** el sistema responde `{ data: [...], total: 25, limit: 10, offset: 20 }`