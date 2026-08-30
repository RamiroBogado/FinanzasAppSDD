## MODIFIED Requirements

### Requirement: Registro de usuario
El sistema DEBE permitir registrar un usuario mediante `POST /api/auth/register` con username (alfanumérico + `_`, único case-insensitive), email (único case-insensitive), y password (≥8 caracteres, bcrypt 10 rounds). Responde 201 con usuario público (sin password_hash). Rate limit: 10 req/min por IP.

#### Scenario: Registro exitoso
- **WHEN** usuario envía username único, email único, password ≥8
- **THEN** responde 201 con `{ id, username, email, createdAt }`

#### Scenario: Username duplicado
- **WHEN** username ya existe (case-insensitive)
- **THEN** responde 409 "El nombre de usuario ya está en uso"

#### Scenario: Email duplicado
- **WHEN** email ya existe (case-insensitive)
- **THEN** responde 409 "El correo electrónico ya está en uso"

#### Scenario: Rate limit excedido
- **WHEN** 11 peticiones en 60s desde misma IP
- **THEN** 429 "Demasiadas peticiones, intentá más tarde"

### Requirement: Inicio de sesión
El sistema DEBE permitir login mediante `POST /api/auth/login` con username + password. Valida bcrypt, genera JWT (claims `sub: userId`, `username`, expiración configurable via `JWT_EXPIRES_IN` default 24h). Rate limit: 10 req/min por IP.

#### Scenario: Login exitoso
- **WHEN** credenciales válidas
- **THEN** responde 200 con `{ token }`

#### Scenario: Credenciales inválidas
- **WHEN** usuario o password incorrectos
- **THEN** responde 401 "Usuario o contraseña incorrectos"

#### Scenario: Rate limit excedido
- **WHEN** 11 peticiones en 60s desde misma IP
- **THEN** 429 "Demasiadas peticiones, intentá más tarde"

### Requirement: Recuperación de contraseña
El sistema DEBE permitir solicitar recuperación via `POST /api/auth/forgot-password` con email. Genera token JWT (`type: 'password_reset'`, expiración 1h), envía por email (SMTP), responde 200 genérico. Permite reset via `POST /api/auth/reset-password` con token + nueva password (≥8). Token expira en 1h, se invalida tras uso. Rate limit: 5 req/min por IP.

#### Scenario: Solicitud de recuperación
- **WHEN** email registrado
- **THEN** 200 "Si el correo existe, recibirás instrucciones", email enviado con token

#### Scenario: Reset exitoso
- **WHEN** token válido + nueva password ≥8
- **THEN** 200 "Contraseña actualizada", token invalidado

#### Scenario: Token expirado
- **WHEN** token >1h
- **THEN** 400 "El token ha expirado, solicitá uno nuevo"

### Requirement: Perfil de usuario autenticado
`GET /api/auth/me` DEBE retornar usuario público del token JWT válido. Rate limit global API.

#### Scenario: Perfil válido
- **WHEN** token JWT válido
- **THEN** 200 `{ id, username, email, createdAt }`

#### Scenario: Token inválido
- **WHEN** token expirado o firma inválida
- **THEN** 401 "Token inválido o expirado"