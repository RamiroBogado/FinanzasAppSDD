## Purpose

Estandariza la paginación en todos los listados de recursos financieros (transacciones, presupuestos, metas, alertas) usando `limit`/`offset` con respuesta que incluya `total` para permitir navegación cliente.

## ADDED Requirements

### Requirement: Paginación en listado de transacciones
El endpoint `GET /api/transactions` DEBE aceptar parámetros `limit` (default 50, max 200) y `offset` (default 0). La respuesta DEBE ser un objeto `{ data: Transaction[], total: number, limit: number, offset: number }` en lugar de array directo.

#### Scenario: Paginación primera página
- **WHEN** `GET /api/transactions?limit=20&offset=0`
- **THEN** responde 200 con `{ data: [...], total: 150, limit: 20, offset: 0 }`

#### Scenario: Paginación página posterior
- **WHEN** `GET /api/transactions?limit=20&offset=40`
- **THEN** responde 200 con `{ data: [...], total: 150, limit: 20, offset: 40 }`

#### Scenario: Límite máximo
- **WHEN** `GET /api/transactions?limit=500`
- **THEN** responde 400 "El límite máximo es 200"

### Requirement: Paginación en listado de presupuestos
`GET /api/budgets` DEBE aceptar `limit`/`offset` y responder `{ data: Budget[], total, limit, offset }`.

### Requirement: Paginación en listado de metas
`GET /api/goals` DEBE aceptar `limit`/`offset` y responder `{ data: Goal[], total, limit, offset }`.

### Requirement: Paginación en listado de alertas
`GET /api/alerts` DEBE aceptar `limit`/`offset` y responder `{ data: Alert[], total, limit, offset }`.

### Requirement: Export con paginación opcional
Los endpoints de export (`/api/transactions/export`, etc.) DEBEN aceptar `limit`/`offset` opcionales para exportar subconjuntos.

#### Scenario: Export paginado
- **WHEN** `GET /api/transactions/export?format=csv&limit=100&offset=0`
- **THEN** CSV contiene solo los primeros 100 registros