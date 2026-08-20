## 1. Backend: base y schema

- [x] 1.1 Agregar dependencias `bcryptjs` y `jsonwebtoken` a `backend/package.json`
- [x] 1.2 Crear inicialización idempotente de la tabla `users` (`CREATE TABLE IF NOT EXISTS` más bloque de `ALTER` guiado por `PRAGMA table_info` para bases existentes)
- [x] 1.3 Configurar `JWT_SECRET` (variable de entorno con valor de desarrollo por defecto) y expiración de 24 horas en el módulo de autenticación

## 2. Backend: endpoints de autenticación

- [x] 2.1 Implementar middleware `requireAuth` que verifica firma y expiración del JWT, resuelve el usuario del token y responde errores de autenticación en español
- [x] 2.2 Implementar `POST /api/auth/register`: validación de username (sin espacios, letras/números/guion bajo), email sintáctico y contraseña; unicidad case-insensitive de username y email con respuestas 409 en español; hash con bcryptjs y respuesta 201 sin iniciar sesión
- [x] 2.3 Implementar `POST /api/auth/login`: búsqueda por username case-insensitive, comparación de hash y emisión de JWT de 24 horas; error 401 genérico `Usuario o contraseña incorrectos` sin distinguir credencial; el email no se acepta como identificador
- [x] 2.4 Implementar `GET /api/auth/me` protegido y `POST /api/auth/forgot-password` con respuesta genérica que no revela si el email está registrado
- [x] 2.5 Montar las rutas `/api/auth/*` en la aplicación Express conectándolas con la base de datos existente

## 3. Backend: tests

- [x] 3.1 Tests de registro: éxito (con hash verificado en base), username duplicado con distinto case, email duplicado, username inválido y contraseña no almacenada en texto plano
- [x] 3.2 Tests de login: éxito, username con distinto formato de mayúsculas, credenciales inválidas (usuario inexistente y contraseña incorrecta) y rechazo de email como identificador
- [x] 3.3 Tests de `/api/auth/me` (con y sin token) y de `forgot-password` con email registrado y no registrado (misma respuesta genérica)

## 4. Frontend: autenticación

- [x] 4.1 Crear API helper centralizado que adjunte `Authorization: Bearer <token>` y normalice los errores en español de la API
- [x] 4.2 Crear Context `useAuth` con persistencia del token en `localStorage`, restauración de sesión vía `GET /api/auth/me` y acciones `login`, `register` y `logout`
- [x] 4.3 Crear las páginas `/login` y `/registro` con textos en español
- [x] 4.4 Agregar una ruta protegida de ejemplo que muestre el username del usuario autenticado y el botón `Cerrar sesión`, con redirección a `/login` sin sesión, e integrar las rutas en el router manteniendo el mensaje existente en la página inicial

## 5. Integración y verificación

- [x] 5.1 Agregar `JWT_SECRET` al servicio `backend` en `docker-compose.yml`
- [x] 5.2 Verificar backend: `npm run lint` y `npm test` en `backend/`
- [x] 5.3 Verificar frontend: `npm run lint` y `npm run build` en `frontend/`
- [x] 5.4 Verificar arranque unificado: `docker compose up -d --build app` y validación en UI del flujo registro → login → consulta de sesión → logout