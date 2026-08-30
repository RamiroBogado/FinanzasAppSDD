# Proposal: backend-hardening

## Why

La auditoría del backend reveló 4 hallazgos **críticos** y varios de prioridad alta que deben corregirse antes de considerar el backend listo para producción: JWT secret hardcoded, ausencia de rate limiting, ausencia de security headers (helmet/CSP), y CORS no configurado. Además hay mejoras de robustez (WAL mode, query frágil en alerts, paginación, forgot-password real, chat rate limiting).

## What Changes

- **Seguridad crítica**:
  - Requerir `JWT_SECRET` via variable de entorno (eliminar fallback hardcoded)
  - Instalar y configurar `helmet` (CSP, HSTS, X-Frame-Options, etc.)
  - Instalar y configurar `cors` con origen explícito del frontend
  - Instalar y configurar `express-rate-limit` en `/api/auth/*` (login/register) y global
- **Base de datos**:
  - Activar `PRAGMA journal_mode=WAL` + `synchronous=NORMAL` en `db.js`
  - Corregir query frágil en `alerts.js` (concatenación de fechas → parámetros)
- **Funcionalidad incompleta**:
  - Implementar `forgot-password` real (token JWT + email via nodemailer)
  - Rate limit + sanitización en `/api/chat` (longitud máx, logging)
- **Configuración**:
  - `JWT_EXPIRES_IN` configurable via env
  - Variables de entorno documentadas en `.env.example`
- **Mejoras de robustez** (prioridad alta):
  - Paginación (`limit`/`offset` + `total`) en `/api/transactions`, `/api/budgets`, `/api/goals`, `/api/alerts`
  - `forgot-password` real con token JWT de un solo uso + email

## Capabilities

### New Capabilities
- `rate-limiting`: Límite de peticiones por IP/usuario en endpoints sensibles
- `security-headers`: Headers de seguridad HTTP (CSP, HSTS, X-Frame-Options, etc.)
- `cors-policy`: Política CORS explícita con origen permitido
- `wal-mode`: Modo WAL de SQLite para mejor concurrencia
- `forgot-password`: Recuperación de contraseña real vía email con token JWT
- `chat-protection`: Rate limit y sanitización en endpoint de chatbot
- `pagination`: Paginación estándar en listados de recursos financieros

### Modified Capabilities
- `user-auth`: JWT secret y expiración configurables via env; rate limit en auth; forgot-password real
- `transactions`: Paginación en listado y export
- `budgets`: Paginación en listado
- `goals`: Paginación en listado
- `alerts`: Query corregida con parámetros (sin concatenación SQL)
- `chat`: Rate limit + sanitización de input

## Impact

- **Archivos modificados**: `backend/src/config.js`, `backend/src/app.js`, `backend/src/db.js`, `backend/src/routes/auth.js`, `backend/src/routes/chat.js`, `backend/src/routes/alerts.js`, `backend/src/routes/transactions.js`, `backend/src/routes/budgets.js`, `backend/src/routes/goals.js`, `backend/src/transactions.js`, `backend/src/budgets.js`, `backend/src/goals.js`
- **Nuevas dependencias**: `helmet`, `cors`, `express-rate-limit`, `nodemailer`
- **Variables de entorno nuevas**: `JWT_SECRET` (requerida), `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- **Tests**: Actualizar/agregar tests para rate limiting, headers, paginación, forgot-password, WAL mode
- **Docker**: Rebuild de imagen backend con nuevas dependencias