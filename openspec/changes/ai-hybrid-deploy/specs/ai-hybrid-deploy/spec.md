# ai-hybrid-deploy Specification

## Purpose

Define la topología híbrida de producción: la aplicación web y la API operan juntas en un mismo alojamiento y el servicio de IA opera en un alojamiento externo con volumen persistente, con Turso como única fuente de datos en producción y flujo frontend → backend → IA sin accesos directos del frontend a la IA.

## Requirements

### Requirement: Topología híbrida con Turso como fuente única en producción

El sistema MUST operar en producción con la aplicación web y la API en un mismo alojamiento y el servicio de IA en un alojamiento externo con volumen persistente, y la IA MUST leer los datos financieros desde Turso. La base local MUST quedar como alternativa solo para operación local y rollback.

#### Scenario: Chatbot en producción responde con datos de Turso

- **WHEN** el usuario autenticado pregunta por sus finanzas en el despliegue de producción
- **THEN** la respuesta se genera a partir de los datos de ese usuario leídos desde Turso

#### Scenario: Rollback a operación local

- **WHEN** la URL del servicio de IA apunta al servicio local y la IA usa la base local en solo-lectura
- **THEN** el chatbot responde con los datos locales sin cambios de contrato

### Requirement: Proxy del backend hacia la IA con autorización propagada

El backend MUST reenviar las solicitudes del chatbot recibidas en `POST /api/chat/messages` hacia `POST /ai/chatbot/message` usando la URL configurada en `AI_SERVICE_URL`, propagando el encabezado `Authorization` original, con un tiempo de espera configurable. Ante IA no disponible o respuesta inválida el backend MUST responder 502 con el error `El asistente no está disponible en este momento`.

#### Scenario: Mensaje reenviado con autorización

- **WHEN** el usuario autenticado envía un mensaje a `POST /api/chat/messages`
- **THEN** el backend lo reenvía a la IA con el `Authorization` original y devuelve el `reply` al frontend

#### Scenario: IA no disponible

- **WHEN** el servicio de IA no responde o devuelve una respuesta inválida
- **THEN** el backend responde 502 con el error `El asistente no está disponible en este momento`

### Requirement: Frontend sin acceso directo a la IA

El frontend MUST comunicarse únicamente con la API del backend para el chatbot y MUST NOT llamar directamente al servicio de IA ni requerir configuración CORS nueva hacia la IA.

#### Scenario: Conversación solo vía backend

- **WHEN** el usuario autenticado conversa desde el widget de chat
- **THEN** todas las solicitudes del frontend van a `/api/*` y ninguna va directa a la IA

### Requirement: Autenticación compartida y lectura sin escritura

El servicio de IA MUST validar el mismo JWT que el backend con el secreto compartido `JWT_SECRET`, y MUST NOT escribir en Turso: el token usado por la IA MUST ser de solo-lectura. El alojamiento de la IA MUST proveer volumen persistente para el índice vectorial y caché de modelos, y MUST documentar el comportamiento de arranque en frío. La librería de acceso a Turso de la IA MUST operar en modo solo-lectura con paridad respecto de la lectura local actual.

#### Scenario: Token válido aceptado entre alojamientos

- **WHEN** se invoca la IA con el JWT emitido por el backend
- **THEN** la IA lo acepta y responde según el usuario autenticado

#### Scenario: Escritura rechazada desde la IA

- **WHEN** se intenta una escritura en Turso con las credenciales de la IA
- **THEN** la operación es rechazada y los datos permanecen intactos

### Requirement: Configuración documentada y verificación por capa

La documentación del despliegue MUST describir la conexión de solo-lectura a Turso con `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, la URL de la IA con `AI_SERVICE_URL` y la operación local con `DB_PATH`. Cada capa modificada MUST superar su verificación correspondiente antes de cerrar el change.

#### Scenario: Docs permiten levantar el híbrido

- **WHEN** se sigue la documentación con credenciales válidas de solo-lectura
- **THEN** el flujo frontend → backend → IA responde con datos de Turso del usuario

#### Scenario: Verificación verde por capa

- **WHEN** se ejecutan las verificaciones de las capas modificadas
- **THEN** todas finalizan en verde sin errores
