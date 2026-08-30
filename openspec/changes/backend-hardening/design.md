## Context

El backend actual (commit `597db15`) tiene 159 tests pasando y funcionalidad completa, pero carece de controles de seguridad básicos para producción: JWT secret hardcoded, sin rate limiting, sin security headers, CORS implícito, WAL mode desactivado, query frágil en alerts, forgot-password stub, sin paginación, sin rate limit en chat. Ver `proposal.md` para motivación completa y `specs/*/spec.md` para requisitos detallados.

## Goals / Non-Goals

**Goals:**
- Endurecer seguridad para producción (JWT, rate limit, headers, CORS, WAL)
- Completar funcionalidad pendiente (forgot-password real, paginación, chat protection)
- Corregir deuda técnica (query alerts, JWT config)
- Mantener 159/159 tests passing y compatibilidad hacia atrás

**Non-Goals:**
- Cambios en frontend (salvo ajustes mínimos de API response format para paginación)
- Migración a otro motor de BD
- Refactor de arquitectura (mantener routes → services → db)
- Sistema de migraciones formal (seguir con PRAGMA ALTER)

## Decisions

### 1. Dependencias nuevas
| Paquete | Versión | Justificación |
|---------|---------|---------------|
| `helmet` | ^7.0 | Security headers estándar, mantenido por expertos |
| `cors` | ^2.8 | Estándar de facto para CORS en Express |
| `express-rate-limit` | ^7.0 | Middleware maduro, suporta keyGenerator custom (IP + userId) |
| `nodemailer` | ^6.9 | Estándar para envío email, soporte SMTP pool |

**Alternativas consideradas:**
- `koa-helmet` / `fastify-helmet` → No, stack es Express
- Rate limit casero → No, `express-rate-limit` maneja store, keyGenerator, headers estándar
- `emailjs` / `sendgrid` SDK → `nodemailer` es más flexible (SMTP genérico)

### 2. JWT Secret & Config
- **Eliminar fallback hardcoded** en `config.js`. `JWT_SECRET` **requerida** en env; si no existe en prod → crash al inicio con mensaje claro.
- `JWT_EXPIRES_IN` configurable (default `24h`), parseable por `ms` library o string directo a `jsonwebtoken`.
- `JWT_SECRET` rotación: documentar procedimiento (generar nuevo, deploy, invalidar tokens existentes).

### 3. Rate Limiting Strategy
| Endpoint | Límite | Ventana | Key |
|----------|--------|---------|-----|
| `/api/auth/register` | 10 | 60s | IP |
| `/api/auth/login` | 10 | 60s | IP |
| `/api/auth/forgot-password` | 5 | 60s | IP |
| `/api/auth/reset-password` | 5 | 60s | IP |
| `/api/chat/messages` | 20 | 60s | `userId` (JWT) |
| `/api/*` (auth) | 100 | 60s | `userId` (JWT) |

**Implementación:** 3 middlewares `rateLimit` instanciados con opciones distintas, montados en orden: auth-specific → chat-specific → global-api. `keyGenerator` usa `req.ip` para auth, `req.userId` para autenticados.

### 4. Security Headers (helmet)
Configuración:
```js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind usa inline styles
      fontSrc: ["'self'", "data:"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http://localhost:3001", "http://localhost:3002"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
}))
```
**Nota:** `unsafe-inline` para styles necesario por Tailwind JIT en dev. En prod considerar nonces.

### 5. CORS
```js
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origen no autorizado'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
```
**Nota:** `origin: false` para requests sin Origin (curl, tests). `allowedOrigins` incluye `http://localhost:5173` por default.

### 6. WAL Mode
En `db.js` `getDatabase()`:
```js
if (!isTest) {
  database.pragma('journal_mode = WAL');
  database.pragma('synchronous = NORMAL');
}
```
**Riesgo:** WAL crea archivos `-wal` y `-shm` junto a `finanzas.db`. Docker volume debe persistir directorio completo `/app/data/`.

### 6. Forgot Password Flow
1. `POST /api/auth/forgot-password` → busca user por email (case-insensitive). Si existe:
   - Genera JWT `password_reset` (claims: `sub: userId`, `type: 'password_reset'`, `exp: 1h`, `jti: uuid`).
   - Guarda `jti` en tabla nueva `password_reset_tokens` (id, user_id, jti, used, expires_at, created_at).
   - Envía email con link `https://app/reset-password?token=<jwt>`.
2. `POST /api/auth/reset-password` → valida JWT (firma, exp, `type`, `jti` no usado en BD). Si OK:
   - Hash nueva password (bcrypt 10).
   - Marca token `used = true`.
   - Responde 200.

**Tabla nueva:** `password_reset_tokens` (id PK, user_id FK, jti UNIQUE, used BOOLEAN DEFAULT 0, expires_at, created_at). Índice en `user_id` + `jti`.

### 7. Chat Protection
- Rate limit: 20 req/min por `userId` (middleware específico en `/api/chat/messages`).
- Validación: `message.length <= 2000`, no vacío, regex contra patrones: `/ignore previous instructions|system prompt|jailbreak|override/i`.
- Logging: `console.log(JSON.stringify({ userId, ts: Date.now(), len: message.length, status: 'ok' }))` (stdout → Docker logs).

### 8. Pagination
Response envelope estándar:
```json
{ "data": [...], "total": 150, "limit": 50, "offset": 0 }
```
Parámetros: `limit` (query, default 50, max 200), `offset` (default 0). Validación en cada route. `total` via `COUNT(*)` query separada (índices existentes cubren filtros).

Afecta: `transactions.js`, `budgets.js`, `goals.js`, `alerts.js` (list functions + routes). Export endpoints aceptan `limit`/`offset` opcionales.

### 9. Alerts Query Fix
En `alerts.js` `LIST_BUDGETS_QUERY`:
```sql
-- Antes (frágil):
AND t.date >= b.month || '-01' AND t.date <= b.month || '-31'

-- Después (parametrizado):
AND t.date >= ? AND t.date <= ?
```
Params: `month || '-01'`, `date(month || '-01', '+1 month', '-1 day')` (último día real del mes).

### 10. JWT Secret Required
En `config.js`:
```js
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
export const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);
```
Si `jwtSecret` es `undefined` en prod → crash temprano.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Rate limit falso positivo en usuarios legítimos | Defaults conservadores (100/min), configurables via env; logs de 429 para tuning |
| CSP rompe frontend (inline styles Tailwind) | `unsafe-inline` en `style-src` solo; revisar en prod con nonces |
| CORS bloquea desarrollo si origen cambia | Default `localhost:5173`; `CORS_ORIGIN` configurable |
| WAL crea archivos extra en volume | Documentar en Docker volume mount; `docker-compose` ya monta `/app/data` |
| Forgot-password requiere SMTP | Dev: log token en consola si no hay SMTP; prod: requiere config SMTP real |
| Rate limit keys (IP vs userId) | Auth endpoints por IP (antes de auth); autenticados por `userId` (tras JWT) |
| Paginación rompe frontend existente | Frontend deberá adaptarse a envelope `{data,total,limit,offset}`; cambio breaking documentado |
| `password_reset_tokens` tabla nueva | Migración idempotente via `ensureTable` en `schema.js` |

## Migration Plan

1. **Instalar deps**: `npm i helmet cors express-rate-limit nodemailer`
2. **Actualizar `config.js`**: JWT secret required, expiresIn configurable
3. **Actualizar `app.js`**: helmet, cors, rate limit middlewares (orden: auth → chat → global)
4. **Actualizar `db.js`**: WAL mode + sync NORMAL (no en test)
5. **Actualizar `schema.js`**: tabla `password_reset_tokens` + ALTER idempotente
6. **Actualizar `routes/auth.js`**: rate limit en register/login/forgot/reset; forgot/reset endpoints reales
7. **Actualizar `routes/chat.js`**: rate limit, validación mensaje, logging
8. **Actualizar `routes/alerts.js`**: query parametrizada
9. **Actualizar `routes/transactions.js`, `budgets.js`, `goals.js`**: paginación + envelope response
10. **Actualizar `transactions.js`, `budgets.js`, `goals.js`, `alerts.js`**: list functions con count query
11. **Tests**: agregar/actualizar tests para rate limit, headers, paginación, forgot-password, WAL
12. **Docker**: rebuild backend image
13. **Variables de entorno**: documentar en `.env.example` y README

**Rollback:** `git revert` del merge commit; Docker image anterior; DB schema compatible (tabla nueva no rompe nada).

## Open Questions

1. **SMTP en dev**: ¿Usar Ethereal Email (fake SMTP) o solo log en consola? → Log en consola por simplicidad.
2. **CSP `unsafe-inline` para styles**: ¿Aceptable o implementar nonces? → Aceptable para MVP, nonces en follow-up.
3. **Rate limit store**: Memoria (default) vs Redis. → Memoria OK para single instance; documentar limitación.
4. **Paginación breaking change**: ¿Versionar API (`/api/v2/`) o mantener `/api/v1/` con nuevo formato? → Mantener `/api/` con envelope; documentar como breaking v1.1.
5. **Reset password token storage**: ¿Tabla dedicada o usar `chat_messages` existente? → Tabla dedicada `password_reset_tokens` (más limpio).