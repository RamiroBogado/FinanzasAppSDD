## Why

El bootstrap dejó la base técnica del monorepo, pero la aplicación todavía no puede identificar a sus usuarios ni proteger sus datos. Sin autenticación no es posible implementar ningún recurso de negocio que respete el aislamiento de la información financiera de cada usuario.

## What Changes

- Backend: nueva tabla `users` (schema SQLite), endpoints REST de registro, login, perfil de sesión (`me`) y solicitud de recuperación de contraseña, middleware de autenticación reutilizable, y dependencias `bcryptjs` y `jsonwebtoken`.
- Sesión: JWT stateless firmado con secret de entorno; expiración de 24 horas; el logout descarta el token en el frontend.
- Frontend: API helper centralizado, Context global `useAuth`, páginas de login y registro, acción de logout y una ruta protegida de ejemplo que identifica al usuario por su username.
- IA: sin cambios en este change. La validación del mismo JWT en los endpoints `/ai` se resolverá en el change del chatbot.
- Ningún cambio es **BREAKING**; se agrega el primer schema de negocio sobre la base existente de SQLite.

## Capabilities

### New Capabilities
- `user-auth`: registro de usuarios con username y email únicos, login mediante username y contraseña con emisión de JWT, consulta del usuario autenticado, logout y solicitud de recuperación de contraseña mediante email.

### Modified Capabilities
- Ninguna.

## Impact

- Backend: schema SQLite nuevo (tabla `users` mediante `CREATE TABLE IF NOT EXISTS` y bloque de `ALTER` guiado por `PRAGMA table_info` para bases existentes), nuevas rutas bajo `/api/auth/*`, middleware `requireAuth`, dependencias `bcryptjs` y `jsonwebtoken`.
- Frontend: páginas `/login` y `/registro`, componentes de navegación con logout, Context `useAuth` y API helper bajo `src/`.
- ai: sin modificaciones.
- Verificación por capa: `npm run lint` + `npm test` en `backend/`; `npm run lint` + `npm run build` en `frontend/`; arranque unificado `docker compose up -d --build app` con validación del flujo de registro y login en la UI.