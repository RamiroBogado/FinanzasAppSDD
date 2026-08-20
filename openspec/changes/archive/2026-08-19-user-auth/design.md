## Context

El backend tiene Express 5 + better-sqlite3 con solo `GET /health`, sin schema de negocio (`src/db.js` usa `:memory:` en tests y `DB_PATH` en producción). El frontend es una página única con el mensaje `FinanzasApp está funcionando`, proxy Vite configurado (`/api` → 3001, `/ai` → 3002) y React Router. No existe autenticación en ninguna capa, por lo que no puede resolverse el usuario autenticado para ningún recurso. Motivación y alcance en `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Schema SQLite `users` idempotente que funcione tanto en bases nuevas como existentes.
- Autenticación REST stateless con JWT (24 h) y hash de contraseñas con bcryptjs.
- Middleware `requireAuth` reutilizable que todos los recursos futuros puedan aplicar.
- Frontend con login, registro y logout que identifique al usuario por username, con sesión persistente.
- Errores de API y textos de UI en español.

**Non-Goals:**
- Restablecimiento de contraseña completo (solo solicitud genérica; el email no se envía).
- Refresh tokens, revocación server-side de JWT ni blacklist.
- Validación del JWT en el servicio `ai/` (se resolverá con el change del chatbot).
- Rate limiting, captcha ni protección anti fuerza bruta.

## Decisions

**1. Hash de contraseñas con bcryptjs**
Alternativas: `bcrypt` nativo (binarios nativos, complica la imagen Docker Alpine), `scrypt` de `node:crypto` (implementación manual de comparación y parámetros). Se elige `bcryptjs` porque es la librería prevista en el contexto del proyecto, es JavaScript puro (sin binarios) y su API de `hash`/`compare` es directa.

**2. JWT con jsonwebtoken, stateless, 24 h**
Alternativas: tokens opacos con sesión en DB (más estados, complica el aislamiento futuro backend↔ai), refresh tokens (revocación real pero más superficie de código). Se elige JWT stateless porque está previsto en el contexto (backend y ai comparten el mismo JWT en el futuro) y el logout se implementa descartando el token en el frontend. El secret se lee de la variable de entorno `JWT_SECRET` (valor de desarrollo como fallback documentado) y la expiración es de 24 horas. El payload contiene `sub` (id de usuario) y `username`; el middleware `requireAuth` verifica la firma, la expiración y resuelve el usuario del `sub`.

**3. Tabla `users` con unicidad case-insensitive**
Columnas: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `username TEXT NOT NULL UNIQUE COLLATE NOCASE`, `email TEXT NOT NULL UNIQUE COLLATE NOCASE`, `password_hash TEXT NOT NULL`, `created_at TEXT NOT NULL` (ISO `YYYY-MM-DD`). El `UNIQUE COLLATE NOCASE` garantiza que `Rama` y `rama` no coexistan y permite buscar por username en el login ignorando mayúsculas. El email se normaliza a minúsculas antes de guardar y comparar. Alternativa considerada: guardar el username normalizado en minúsculas — se descarta porque la interfaz debe mostrar el username tal como el usuario lo eligió.

**4. Rutas de la API bajo `POST /api/auth/*`**
- `POST /api/auth/register`: valida username (sin espacios, letras/números/`_`), email (formato sintáctico básico) y contraseña (mínimo 8 caracteres); responde 409 con `El nombre de usuario ya está en uso` o `El correo electrónico ya está en uso`, 400 con errores de validación y 201 con el usuario creado (sin token: el registro no inicia sesión).
- `POST /api/auth/login`: busca por username case-insensitive, compara hash y emite el token; ante cualquier fallo responde 401 `Usuario o contraseña incorrectos` (no distingue cuál falló). El email no se acepta como identificador.
- `GET /api/auth/me`: protegido con `requireAuth`, devuelve `id`, `username` y `email` del usuario del token.
- `POST /api/auth/forgot-password`: valida el email sintácticamente y responde siempre 200 con el mensaje genérico de recuperación sin revelar si el email está registrado; no envía emails ni cambia contraseñas.

**5. Frontend: helper de API, Context `useAuth` y rutas**
El token se guarda en `localStorage` (`finanzas_token`) para que la sesión persista al recargar. El API helper centraliza `fetch` con `Authorization: Bearer <token>` y normaliza errores de la API. `AuthContext` expone `user`, `login`, `register` y `logout`, y al iniciar la app restaura la sesión consultando `GET /api/auth/me`. Páginas: `/login` y `/registro` públicas; la página inicial `/` conserva el mensaje `FinanzasApp está funcionando`; una ruta protegida de ejemplo (`/app`) muestra el username del usuario y el botón `Cerrar sesión`, y redirige a `/login` cuando no hay sesión. Se mantiene la integración mediante el proxy Vite ya existente (el frontend llama a `/api/auth/*`).

**6. Integración con Docker**
El servicio `backend` en `docker-compose.yml` recibe `JWT_SECRET` desde el entorno con un valor de desarrollo por defecto, y la tabla `users` se crea idempotente al arrancar sobre `finanzas_data` (la base persiste por volumen).

## Risks / Trade-offs

- [JWT stateless no revocable hasta su expiración] → Mitigación: expiración de 24 horas acotada; si se requiere revocación real se evaluará refresh tokens en un change futuro.
- [bcryptjs es más lento que bcrypt nativo] → Mitigación: factor de costo 10 (valor por defecto), suficiente para el volumen esperado de usuarios.
- [`COLLATE NOCASE` depende de la regla binaria de SQLite para el texto comparado] → Mitigación: suficiente para usernames/emails simples; si se requiriera normalización Unicode completa se migraría a almacenamiento normalizado con validación explícita.
- [El restablecimiento de contraseña queda sin flujo funcional] → Mitigación: el endpoint responde genéricamente y no simula envíos; el flujo completo se diseña en un change futuro sin cambiar el contrato de este endpoint.
- [Mensaje genérico de recuperación puede confundir a usuarios reales] → Mitigación: es la práctica estándar para no filtrar emails registrados; el flujo real de reset llegará con el envío de email.

## Migration Plan

- Bases nuevas: el backend ejecuta `CREATE TABLE IF NOT EXISTS users` al arrancar.
- Bases existentes: el mismo bloque de inicialización guiado por `PRAGMA table_info` (patrón acordado) prepara la tabla si faltara; aquí no hay columnas adicionales que alterar porque la tabla es nueva.
- Rollback: retirar las rutas y el middleware; la tabla `users` puede permanecer sin impacto en el resto del sistema.