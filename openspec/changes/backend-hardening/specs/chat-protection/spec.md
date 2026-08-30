## Purpose

Protege el endpoint del chatbot contra abuso limitando la tasa de consultas, validando la longitud del mensaje, y sanitizando entrada para prevenir prompt injection.

## ADDED Requirements

### Requirement: Rate limiting en chatbot
Ver spec `rate-limiting` (requisito específico para `/api/chat/messages`: 20 req/min por usuario).

### Requirement: Validación y sanitización de mensaje
El endpoint `/api/chat/messages` DEBE rechazar mensajes vacíos, mayores a 2000 caracteres, o que contengan patrones de prompt injection conocidos (ej: "ignore previous instructions", "system prompt", "jailbreak"). Al detectar patrón sospechoso, DEBE responder 400 "Mensaje no válido".

#### Scenario: Mensaje muy largo
- **WHEN** usuario envía mensaje de 2001 caracteres
- **THEN** responde 400 "El mensaje no puede superar 2000 caracteres"

#### Scenario: Patrón de prompt injection
- **WHEN** mensaje contiene "ignore previous instructions"
- **THEN** responde 400 "Mensaje no válido"

### Requirement: Logging de consultas
Cada consulta al chatbot DEBE loguearse (usuario, timestamp, longitud mensaje, respuesta OK/error) para auditoría.

#### Scenario: Log de consulta
- **WHEN** usuario hace consulta válida
- **THEN** se registra log con `userId`, `timestamp`, `messageLength`, `status: "ok"`