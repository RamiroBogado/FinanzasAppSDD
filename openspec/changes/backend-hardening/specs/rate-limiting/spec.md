## Purpose

Protege la API contra abuso y ataques de fuerza bruta limitando el número de peticiones por IP y por usuario autenticado en ventanas de tiempo configurables.

## ADDED Requirements

### Requirement: Rate limiting en endpoints de autenticación
El sistema DEBE limitar las peticiones a `/api/auth/register` y `/api/auth/login` a un máximo configurable (por defecto 10 peticiones por minuto por IP). Al exceder el límite, DEBE responder 429 con mensaje "Demasiadas peticiones, intentá más tarde" y header `Retry-After` en segundos.

#### Scenario: Exceso de intentos de login
- **WHEN** un cliente hace 11 peticiones POST a `/api/auth/login` en menos de 60 segundos desde la misma IP
- **THEN** la 11ª petición recibe 429 con mensaje "Demasiadas peticiones, intentá más tarde" y header `Retry-After`

#### Scenario: Exceso de intentos de registro
- **WHEN** un cliente hace 11 peticiones POST a `/api/auth/register` en menos de 60 segundos desde la misma IP
- **THEN** la 11ª petición recibe 429 con mensaje "Demasiadas peticiones, intentá más tarde" y header `Retry-After`

### Requirement: Rate limiting global en API autenticada
El sistema DEBE aplicar un límite global configurable (por defecto 100 peticiones por minuto por usuario autenticado) a todos los endpoints bajo `/api/` que requieren autenticación. Al exceder el límite, DEBE responder 429 con mensaje "Límite de peticiones excedido, intentá más tarde" y header `Retry-After`.

#### Scenario: Exceso de peticiones autenticadas
- **WHEN** un usuario autenticado hace 101 peticiones a cualquier endpoint `/api/*` en menos de 60 segundos
- **THEN** la 101ª petición recibe 429 con mensaje "Límite de peticiones excedido, intentá más tarde" y header `Retry-After`

### Requirement: Rate limiting en endpoint de chatbot
El sistema DEBE limitar las peticiones a `/api/chat/messages` a un máximo configurable (por defecto 20 peticiones por minuto por usuario). Al exceder el límite, DEBE responder 429 con mensaje "Demasiadas consultas al asistente, intentá más tarde" y header `Retry-After`.

#### Scenario: Exceso de consultas al chatbot
- **WHEN** un usuario autenticado hace 21 peticiones POST a `/api/chat/messages` en menos de 60 segundos
- **THEN** la 21ª petición recibe 429 con mensaje "Demasiadas consultas al asistente, intentá más tarde" y header `Retry-After`

### Requirement: Configuración via variables de entorno
Los límites y ventanas de tiempo DEBEN ser configurables mediante variables de entorno: `RATE_LIMIT_AUTH_MAX` (default 10), `RATE_LIMIT_AUTH_WINDOW_MS` (default 60000), `RATE_LIMIT_API_MAX` (default 100), `RATE_LIMIT_API_WINDOW_MS` (default 60000), `RATE_LIMIT_CHAT_MAX` (default 20), `RATE_LIMIT_CHAT_WINDOW_MS` (default 60000).

#### Scenario: Configuración personalizada via env
- **WHEN** el servidor inicia con `RATE_LIMIT_AUTH_MAX=5` y `RATE_LIMIT_AUTH_WINDOW_MS=30000`
- **THEN** el límite de auth aplica 5 peticiones por 30 segundos por IP