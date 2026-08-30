## Purpose

Permite a los usuarios recuperar su contraseña mediante un token JWT de un solo uso enviado por email, con expiración corta y invalidación tras uso.

## ADDED Requirements

### Requirement: Solicitud de recuperación de contraseña
Al solicitar recuperación en `/api/auth/forgot-password` con email válido, el sistema DEBE generar un token JWT de recuperación (expiración 1 hora, claim `type: 'password_reset'`, `sub: userId`), enviarlo por email via SMTP, y responder siempre 200 con mensaje genérico "Si el correo existe, recibirás instrucciones" (no revelar si el email existe).

#### Scenario: Solicitud con email existente
- **WHEN** usuario solicita recuperación con email registrado
- **THEN** responde 200 con mensaje genérico, y se envía email con token de recuperación

#### Scenario: Solicitud con email inexistente
- **WHEN** usuario solicita recuperación con email no registrado
- **THEN** responde 200 con mismo mensaje genérico (no revela existencia)

#### Scenario: Email inválido
- **WHEN** se envía email con formato inválido
- **THEN** responde 400 "El correo electrónico no es válido"

### Requirement: Restablecimiento de contraseña
El endpoint `/api/auth/reset-password` DEBE aceptar `token` y `newPassword`, validar el token (firma, expiración, claim `type: 'password_reset'`, no usado), hashear la nueva contraseña con bcrypt (10 rounds), invalidar el token (marcar usado), y responder 200.

#### Scenario: Restablecimiento exitoso
- **WHEN** usuario envía token válido y nueva contraseña ≥8 caracteres
- **THEN** contraseña actualizada, token invalidado, responde 200 "Contraseña actualizada"

#### Scenario: Token expirado
- **WHEN** token tiene más de 1 hora de antigüedad
- **THEN** responde 400 "El token ha expirado, solicitá uno nuevo"

#### Scenario: Token ya usado
- **WHEN** se reutiliza un token ya consumido
- **THEN** responde 400 "El token ya fue utilizado, solicitá uno nuevo"

#### Scenario: Contraseña inválida
- **WHEN** nueva contraseña tiene menos de 8 caracteres
- **THEN** responde 400 "La contraseña debe tener al menos 8 caracteres"

### Requirement: Configuración SMTP via variables de entorno
El envío de email DEBE usar `nodemailer` con configuración via env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`. En desarrollo sin SMTP configurado, loguear el token en consola en lugar de enviar.

#### Scenario: Desarrollo sin SMTP
- **WHEN** `SMTP_HOST` no está configurado
- **THEN** el token se loguea en consola con prefijo `[DEV RESET TOKEN]` en lugar de enviar email