## MODIFIED Requirements

### Requirement: Listado de transacciones propias
El sistema DEBE permitir listar las transacciones del usuario autenticado mediante `GET /api/transactions`, ordenadas por fecha descendente. El listado DEBE aceptar los parámetros opcionales combinables `type` (`income` o `expense`), `category` (coincidencia exacta sin distinguir mayúsculas), `q` (texto parcial en la descripción), `from`/`to` (rango de fechas ISO inclusivo), `limit` (default 50, max 200), `offset` (default 0); si `from` o `to` no son fechas ISO válidas, o `limit` > 200, el sistema DEBE responder 400 con un mensaje en español. La respuesta DEBE ser un objeto `{ data: Transaction[], total: number, limit: number, offset: number }`. El listado NUNCA DEBE incluir transacciones de otros usuarios.

#### Scenario: Listado paginado primera página
- **WHEN** el usuario autenticado consulta `GET /api/transactions?limit=20&offset=0`
- **THEN** el sistema responde `{ data: [...], total: 150, limit: 20, offset: 0 }`

#### Scenario: Paginación página posterior
- **WHEN** el usuario autenticado consulta `GET /api/transactions?limit=20&offset=40`
- **THEN** el sistema responde `{ data: [...], total: 150, limit: 20, offset: 40 }`

#### Scenario: Límite máximo excedido
- **WHEN** el usuario autenticado consulta `GET /api/transactions?limit=500`
- **THEN** el sistema responde 400 con mensaje "El límite máximo es 200"

#### Scenario: Listado con filtro por categoría paginado
- **WHEN** el usuario autenticado consulta `GET /api/transactions?category=comida&limit=10&offset=0`
- **THEN** el sistema responde solo transacciones de esa categoría, con paginación y total correcto

### Requirement: Exportación de transacciones con paginación opcional
El endpoint `GET /api/transactions/export` DEBE aceptar parámetros opcionales `limit` y `offset` para exportar subconjuntos.

#### Scenario: Export paginado
- **WHEN** el usuario autenticado consulta `GET /api/transactions/export?format=csv&limit=100&offset=0`
- **THEN** el CSV contiene solo los primeros 100 registros del resultado filtrado