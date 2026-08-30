## Purpose

Define una política CORS explícita que solo permite orígenes autorizados (frontend en desarrollo y producción) para acceder a la API, rechazando orígenes no permitidos con error 403.

## ADDED Requirements

### Requirement: Política CORS restrictiva
El sistema DEBE rechazar peticiones con `Origin` no incluido en la lista permitida, respondiendo 403 con mensaje "Origen no autorizado". Los orígenes permitidos DEBEN ser configurables via variable de entorno `CORS_ORIGIN` (coma-separada, default `http://localhost:5173`).

#### Scenario: Origen permitido
- **WHEN** el frontend en `http://localhost:5173` hace petición a `/api/transactions`
- **THEN** la respuesta incluye `Access-Control-Allow-Origin: http://localhost:5173` y headers CORS apropiados

#### Scenario: Origen no permitido
- **WHEN** un cliente desde `http://malicioso.com` hace petición a `/api/transactions`
- **THEN** la respuesta es 403 con mensaje "Origen no autorizado" sin headers CORS

### Requirement: Credenciales y métodos permitidos
El sistema DEBE permitir credenciales (`Access-Control-Allow-Credentials: true`) y los métodos `GET, POST, PUT, DELETE, OPTIONS` con headers `Content-Type, Authorization`.

#### Scenario: Preflight OPTIONS
- **WHEN** el navegador envía `OPTIONS /api/transactions` con `Origin: http://localhost:5173`
- **THEN** respuesta 204 con `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`, `Access-Control-Allow-Headers: Content-Type,Authorization`, `Access-Control-Allow-Credentials: true`

### Requirement: Configuración via variable de entorno
Los orígenes permitidos DEBEN configurarse via `CORS_ORIGIN` (ej: `http://localhost:5173,https://app.finanzasapp.com`).

#### Scenario: Múltiples orígenes permitidos
- **WHEN** `CORS_ORIGIN=http://localhost:5173,https://app.finanzasapp.com`
- **THEN** ambos orígenes son aceptados, otros son rechazados