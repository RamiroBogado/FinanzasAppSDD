## MODIFIED Requirements

### Requirement: Listado de alertas
El sistema DEBE permitir listar las alertas del usuario autenticado mediante `GET /api/alerts`, ordenadas por fecha de creación descendente. El listado DEBE aceptar parámetros opcionales `limit` (default 50, max 200) y `offset` (default 0). La respuesta DEBE ser `{ data: Alert[], total: number, limit: number, offset: number }`. El listado NUNCA DEBE incluir alertas de otros usuarios.

#### Scenario: Listado paginado
- **WHEN** el usuario autenticado consulta `GET /api/alerts?limit=10&offset=0`
- **THEN** el sistema responde `{ data: [...], total: 25, limit: 10, offset: 0 }`

### Requirement: Verificación de alertas con query corregida
El endpoint `POST /api/alerts/check` DEBE usar parámetros parametrizados (no concatenación de strings) para el rango de fechas del mes al consultar `spent` en transacciones.

#### Scenario: Query parametrizada en check
- **WHEN** se ejecuta `POST /api/alerts/check` para mes `2026-08`
- **THEN** la query interna usa parámetros `?` para `month || '-01'` y `month || '-31'` (o `date(month || '-01', '+1 month', '-1 day')` para último día real)