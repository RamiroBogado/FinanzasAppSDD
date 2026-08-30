## MODIFIED Requirements

### Requirement: Listado de presupuestos propios
El sistema DEBE permitir listar los presupuestos del usuario autenticado mediante `GET /api/budgets` e incluir en cada uno `spent` (suma de gastos propios del mismo mes y categoría, case-insensitive) y `threshold`. El listado DEBE aceptar parámetros opcionales `month` (formato `AAAA-MM`, error 400 si inválido), `category`, `limit` (default 50, max 200), `offset` (default 0). La respuesta DEBE ser `{ data: Budget[], total: number, limit: number, offset: number }`. El listado NUNCA DEBE incluir presupuestos de otros usuarios.

#### Scenario: Listado paginado
- **WHEN** el usuario autenticado consulta `GET /api/budgets?limit=10&offset=0`
- **THEN** el sistema responde `{ data: [...], total: 25, limit: 10, offset: 0 }`

#### Scenario: Paginación con filtro por mes
- **WHEN** el usuario autenticado consulta `GET /api/budgets?month=2026-08&limit=5&offset=0`
- **THEN** el sistema responde presupuestos de ese mes con paginación y total correcto