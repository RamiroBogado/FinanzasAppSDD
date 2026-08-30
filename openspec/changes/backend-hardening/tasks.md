## 1. Setup y Dependencias

- [ ] 1.1 Instalar dependencias de seguridad: `npm i helmet cors express-rate-limit nodemailer` en `backend/`
- [ ] 1.2 Actualizar `backend/package.json` con nuevas dependencias en `dependencies`
- [ ] 1.3 Crear/actualizar `.env.example` en raíz con variables: `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_AUTH_WINDOW_MS`, `RATE_LIMIT_API_MAX`, `RATE_LIMIT_API_WINDOW_MS`, `RATE_LIMIT_CHAT_MAX`, `RATE_LIMIT_CHAT_WINDOW_MS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

## 2. Configuración Central (config.js, db.js, schema.js)

- [ ] 2.1 Actualizar `backend/src/config.js`: requerir `JWT_SECRET` en prod, eliminar fallback hardcoded; agregar `jwtExpiresIn` desde `JWT_EXPIRES_IN` env
- [ ] 2.2 Actualizar `backend/src/db.js`: activar `PRAGMA journal_mode=WAL` y `PRAGMA synchronous=NORMAL` solo si no es test
- [ ] 2.3 Actualizar `backend/src/schema.js`: agregar tabla `password_reset_tokens` con `ensureTable` idempotente (id PK, user_id FK, jti UNIQUE, used BOOLEAN DEFAULT 0, expires_at, created_at) + índice en `user_id`

## 3. Middleware de Seguridad en app.js

- [ ] 3.1 Importar `helmet`, `cors`, `rateLimit` de `express-rate-limit` en `backend/src/app.js`
- [ ] 3.2 Configurar `helmet` con CSP (permitir `unsafe-inline` en style-src para Tailwind), HSTS, frameguard DENY, noSniff, referrerPolicy, permissionsPolicy
- [ ] 3.3 Configurar `cors` con `origin` function que valide contra `CORS_ORIGIN` env (default `http://localhost:5173`), `credentials: true`, methods/headers permitidos
- [ ] 3.4 Crear middleware `authRateLimit` (10 req/60s por IP) para `/api/auth/register` y `/api/auth/login`
- [ ] 3.5 Crear middleware `forgotRateLimit` (5 req/60s por IP) para `/api/auth/forgot-password` y `/api/auth/reset-password`
- [ ] 3.6 Crear middleware `chatRateLimit` (20 req/60s por `userId`) para `/api/chat/messages`
- [ ] 3.7 Crear middleware `apiRateLimit` (100 req/60s por `userId`) para todos `/api/*` autenticados
- [ ] 3.8 Montar middlewares en orden: `helmet` → `cors` → `express.json()` → `authRateLimit` en `/api/auth/register` y `/api/auth/login` → `forgotRateLimit` en `/api/auth/forgot-password` y `/api/auth/reset-password` → `chatRateLimit` en `/api/chat/messages` → `apiRateLimit` en `/api/` (después de `requireAuth`)

## 4. Auth Routes (register, login, forgot, reset, me)

- [ ] 4.1 Actualizar `backend/src/routes/auth.js`: montar `authRateLimit` en register y login (ya vía app.js, pero verificar)
- [ ] 4.2 Implementar `POST /api/auth/forgot-password`: buscar user por email case-insensitive; si existe, generar JWT `password_reset` (claims `sub: userId`, `type: 'password_reset'`, `exp: 1h`, `jti: uuid`), guardar en tabla `password_reset_tokens` (jti, user_id, used=0, expires_at, created_at), enviar email via nodemailer (o log en dev si no hay SMTP), responder 200 genérico
- [ ] 4.3 Implementar `POST /api/auth/reset-password`: validar token (firma, exp, `type: 'password_reset'`, `jti` existe en BD y `used=0`), validar nueva password ≥8, hashear bcrypt 10, actualizar user, marcar token `used=1`, responder 200
- [ ] 4.4 Agregar validación de `JWT_EXPIRES_IN` en generación de tokens login/reset
- [ ] 4.4 Mantener `GET /api/auth/me` y `POST /api/auth/register` / `login` existentes (ya cubiertos por rate limit)

## 5. Chat Routes (rate limit, validación, logging)

- [ ] 5.1 Actualizar `backend/src/routes/chat.js`: montar `chatRateLimit` (ya vía app.js)
- [ ] 5.2 Agregar validación en `POST /api/chat/messages`: rechazar mensaje vacío, >2000 chars, patrones prompt injection (`/ignore previous instructions|system prompt|jailbreak|override/i`) → 400 "Mensaje no válido"
- [ ] 5.3 Agregar logging: `console.log(JSON.stringify({ userId: req.userId, ts: Date.now(), len: message.length, status: 'ok' }))` (y `status: 'error'` en catches)
- [ ] 5.4 Mantener proxy a AI service y guardado de historial existente

## 6. Alerts Route (query parametrizada)

- [ ] 6.1 Actualizar `backend/src/routes/alerts.js`: cambiar `LIST_BUDGETS_QUERY` para usar parámetros `?` en lugar de concatenación `b.month || '-01'` / `b.month || '-31'`
- [ ] 6.2 Usar `date(month || '-01', '+1 month', '-1 day')` para último día real del mes en parámetro `to`
- [ ] 6.3 Pasar parámetros en orden correcto al `.all(userId, month, fromDate, toDate)`

## 7. Paginación en Listados (transactions, budgets, goals, alerts)

- [ ] 7.1 Actualizar `backend/src/transactions.js`: `listTransactions` aceptar `limit`/`offset`, agregar `countTransactions` para total, retornar `{ data, total, limit, offset }`
- [ ] 7.2 Actualizar `backend/src/routes/transactions.js`: validar `limit` (default 50, max 200) y `offset` (default 0), cambiar response a envelope `{ data, total, limit, offset }`
- [ ] 7.3 Actualizar `backend/src/routes/transactions.js` export: aceptar `limit`/`offset` opcionales
- [ ] 7.2 Repetir para `budgets.js` + `routes/budgets.js`: `listBudgets` con `limit`/`offset`, `countBudgets`, envelope response
- [ ] 7.3 Repetir para `goals.js` + `routes/goals.js`: `listGoals` con `limit`/`offset`, `countGoals`, envelope response
- [ ] 7.4 Repetir para `alerts.js` + `routes/alerts.js`: `listAlerts` con `limit`/`offset`, `countAlerts`, envelope response
- [ ] 7.5 Actualizar `backend/src/routes/transactions.js` export: aceptar `limit`/`offset` opcionales

## 8. Tests Backend

- [ ] 8.1 Agregar tests en `backend/test/auth.test.js`: rate limit en register/login (11 req → 429), forgot-password flow (token generado, email enviado/logueado, reset exitoso, token expirado, token usado), rate limit en forgot/reset
- [ ] 8.2 Agregar tests en `backend/test/transactions.test.js`: paginación (limit/offset, total correcto, max 200), export con paginación
- [ ] 8.3 Agregar tests en `backend/test/budgets.test.js`: paginación
- [ ] 8.4 Agregar tests en `backend/test/goals.test.js`: paginación
- [ ] 8.5 Agregar tests en `backend/test/alerts.test.js`: paginación, query parametrizada (verificar que usa params)
- [ ] 8.6 Agregar tests en `backend/test/chat.test.js`: rate limit (21 req → 429), validación mensaje largo, prompt injection, logging
- [ ] 8.7 Agregar tests en `backend/test/app.test.js` o nuevo: security headers (helmet), CORS (origen permitido/rechazado), rate limit global auth
- [ ] 8.8 Ejecutar `npm test` en `backend/` → verificar 159+ tests passing
- [ ] 8.9 Ejecutar `npm run lint` en `backend/` → 0 errors

## 9. Verificación End-to-End

- [ ] 9.1 `docker compose build --no-cache backend` → build exitoso
- [ ] 9.2 `docker compose up -d` → todos los contenedores healthy
- [ ] 9.3 Smoke test API: register → login → crear categoría → crear transacción → crear presupuesto → crear meta → forgot-password → reset-password → chat → export
- [ ] 9.4 Verificar headers de seguridad en respuestas (helmet, CORS, rate limit headers `Retry-After`, `X-RateLimit-*`)
- [ ] 9.5 Verificar WAL mode: `docker exec finanzasappsdd-backend-1 sqlite3 /app/data/finanzas.db "PRAGMA journal_mode;"` → `wal`

## 10. Documentación y Variables de Entorno

- [ ] 10.1 Actualizar `.env.example` con todas las variables nuevas
- [ ] 10.2 Actualizar README o docs si existen con instrucciones de configuración SMTP, rate limits, JWT
- [ ] 10.3 Verificar `docker compose build --no-cache app` y `docker compose up -d` funciona completo

## 11. Git y OpenSpec

- [ ] 11.1 Commit cambios en rama `feat/backend-hardening` (commits atómicos en inglés)
- [ ] 11.2 Push y crear PR hacia `master`
- [ ] 11.3 Marcar tasks como `[x]` en `tasks.md` conforme se completan
- [ ] 11.4 Al merge: `openspec archive --yes "backend-hardening"` y actualizar `AGENTS.md`