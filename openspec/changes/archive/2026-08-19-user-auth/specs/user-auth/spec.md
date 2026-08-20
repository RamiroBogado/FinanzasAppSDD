## Purpose

Permite a los usuarios registrarse y autenticarse mediante username y contraseña con sesión JWT, sentando la base para el aislamiento de datos financieros de la aplicación.

## ADDED Requirements

### Requirement: Registro de usuarios
El sistema DEBE permitir registrar un usuario con username, email y contraseña. El username DEBE ser único e interpretado de forma case-insensitive (Rama y rama representan el mismo username), no DEBE contener espacios y DEBE poder contener letras, números y guion bajo (`_`). El email DEBE ser único. La contraseña NUNCA DEBE almacenarse en texto plano. El registro de una cuenta nueva NO DEBE iniciar sesión automáticamente, y los mensajes de error DEBEN estar en español.

#### Scenario: Registro exitoso
- **WHEN** se envía un registro con username, email y contraseña válidos
- **THEN** la cuenta se crea, la contraseña queda almacenada con hash y se responde confirmando el registro sin iniciar sesión automáticamente

#### Scenario: Username duplicado con distinto case
- **WHEN** se envía un registro con un username que ya existe en otro formato de mayúsculas (por ejemplo, registrar `rama` cuando ya existe `Rama`)
- **THEN** el sistema responde un error en español indicando que el nombre de usuario ya está en uso

#### Scenario: Email duplicado
- **WHEN** se envía un registro con un email que ya pertenece a otra cuenta
- **THEN** el sistema responde un error en español indicando que el correo electrónico ya está en uso

#### Scenario: Username inválido
- **WHEN** se envía un registro con un username que contiene espacios o caracteres no permitidos
- **THEN** el sistema responde un error en español indicando el formato válido del username

#### Scenario: La contraseña no se almacena en texto plano
- **WHEN** se inspecciona la base de datos tras un registro exitoso
- **THEN** la contraseña del usuario no se encuentra almacenada en texto plano

### Requirement: Login con username y contraseña
El sistema DEBE autenticar al usuario mediante username y contraseña, interpretando el username de forma case-insensitive, y DEBE emitir un token JWT válido con expiración de 24 horas. El email NO DEBE utilizarse como identificador de login. Cuando las credenciales son inválidas, el sistema DEBE responder un error en español sin revelar si falló el username o la contraseña.

#### Scenario: Login exitoso
- **WHEN** se envía el login con un username y su contraseña correctos
- **THEN** el sistema responde exitosamente con un token JWT válido con expiración de 24 horas

#### Scenario: Login con username en otro formato de mayúsculas
- **WHEN** se envía el login con el username en un formato de mayúsculas distinto al registrado (por ejemplo, `RAMA` cuando se registró `rama`)
- **THEN** el sistema autentica correctamente al mismo usuario

#### Scenario: Credenciales inválidas
- **WHEN** se envía el login con un username inexistente o una contraseña incorrecta
- **THEN** el sistema responde un error en español que no revela si el username o la contraseña fueron los incorrectos

#### Scenario: El email no se utiliza para el login
- **WHEN** se intenta iniciar sesión utilizando el email como identificador
- **THEN** el login se rechaza como credenciales inválidas

### Requirement: Consulta del usuario autenticado
El sistema DEBE exponer un endpoint protegido `GET /api/auth/me` que devuelva los datos del usuario autenticado a partir del token JWT. El frontend DEBE persistir el token para mantener la sesión al recargar la página y DEBE mostrar el username del usuario autenticado en la interfaz.

#### Scenario: Consulta del usuario autenticado
- **WHEN** se envía `GET /api/auth/me` con un token JWT válido
- **THEN** el sistema responde con los datos del usuario dueño del token, incluyendo su username

#### Scenario: Sesión sin token
- **WHEN** se envía `GET /api/auth/me` sin token o con un token inválido o expirado
- **THEN** el sistema responde un error de autenticación en español

#### Scenario: La sesión persiste al recargar la página
- **WHEN** el usuario autenticado recarga la página de la aplicación
- **THEN** la sesión se mantiene y la interfaz sigue identificando al usuario por su username

### Requirement: Cierre de sesión
El sistema DEBE permitir que el usuario autenticado cierre su sesión descartando el token, de modo que las vistas protegidas dejen de estar disponibles hasta un nuevo login. El botón de la interfaz DEBE mostrar el texto `Cerrar sesión`.

#### Scenario: El usuario cierra la sesión
- **WHEN** el usuario autenticado presiona `Cerrar sesión`
- **THEN** el token se descarta, la sesión finaliza y la interfaz deja de mostrar las vistas protegidas

#### Scenario: Después de cerrar la sesión se requiere login
- **WHEN** el usuario intenta acceder a una vista protegida tras cerrar la sesión
- **THEN** el sistema envía al usuario a la página de inicio de sesión

### Requirement: Solicitud de recuperación de contraseña
El sistema DEBE permitir solicitar la recuperación de contraseña mediante el email asociado a la cuenta, respondiendo siempre el mismo mensaje genérico en español independientemente de si el email está registrado, sin revelar qué emails existen en el sistema. En este cambio la solicitud NO DEBE enviar emails reales ni restablecer la contraseña.

#### Scenario: Solicitud con email registrado
- **WHEN** se envía la solicitud de recuperación con el email de una cuenta registrada
- **THEN** el sistema responde el mensaje genérico de recuperación sin confirmar que el email existe

#### Scenario: Solicitud con email no registrado
- **WHEN** se envía la solicitud de recuperación con un email que no pertenece a ninguna cuenta
- **THEN** el sistema responde el mismo mensaje genérico sin revelar que el email no está registrado

#### Scenario: La recuperación no permite iniciar sesión
- **WHEN** el usuario utiliza el email de recuperación como si fuera un identificador de login
- **THEN** el login se rechaza como credenciales inválidas

### Requirement: Protección de recursos autenticados
El sistema DEBE exigir un token JWT válido para acceder a cualquier recurso protegido y DEBE resolver el usuario autenticado a partir del token. Toda operación sobre datos de un usuario DEBE quedar autorizada por dicho token, de modo que ningún usuario pueda operar con datos de otro usuario.

#### Scenario: Acceso protegido sin token
- **WHEN** se envía una solicitud a un recurso protegido sin token o con token inválido o expirado
- **THEN** el sistema rechaza la solicitud con un error de autenticación en español

#### Scenario: El usuario autenticado se resuelve desde el token
- **WHEN** se envía una solicitud a un recurso protegido con un token JWT válido
- **THEN** el sistema opera sobre los datos del usuario autenticado que porta el token

#### Scenario: Un token no da acceso a datos de otro usuario
- **WHEN** un usuario autenticado intenta acceder a datos financieros que pertenecen a otro usuario
- **THEN** el sistema lo rechaza y no expone información de otros usuarios