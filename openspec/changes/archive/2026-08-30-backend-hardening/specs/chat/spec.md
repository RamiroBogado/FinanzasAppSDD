## MODIFIED Requirements

### Requirement: Mensaje al chatbot
El endpoint `POST /api/chat/messages` DEBE aceptar mensaje (string, 1-2000 caracteres), rechazar vacíos o >2000 con 400, y detectar/ rechazar patrones de prompt injection conocidos (ej: "ignore previous instructions", "system prompt", "jailbreak") con 400 "Mensaje no válido". Rate limit: 20 req/min por usuario.

#### Scenario: Mensaje válido
- **WHEN** usuario envía mensaje ≤2000 chars sin patrones sospechosos
- **THEN** responde 200 con `{ reply: "..." }`

#### Scenario: Mensaje muy largo
- **WHEN** mensaje >2000 caracteres
- **THEN** responde 400 "El mensaje no puede superar 2000 caracteres"

#### Scenario: Prompt injection detectado
- **WHEN** mensaje contiene "ignore previous instructions"
- **THEN** responde 400 "Mensaje no válido"

#### Scenario: Rate limit excedido
- **WHEN** 21 peticiones en 60s
- **THEN** 429 "Demasiadas consultas al asistente, intentá más tarde"

### Requirement: Logging de auditoría
Cada consulta DEBE loguear `userId`, `timestamp`, `messageLength`, `status` ("ok" o error code) para auditoría.

#### Scenario: Log generado
- **WHEN** consulta procesada
- **THEN** entrada en log con campos requeridos