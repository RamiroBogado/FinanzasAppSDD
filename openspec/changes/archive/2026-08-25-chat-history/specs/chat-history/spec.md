# chat-history Specification

## Purpose

Permite que cada usuario conserve su conversación con el asistente financiero entre sesiones y dispositivos: los mensajes quedan persistidos por usuario en el backend, el envío se realiza a través del backend como proxy del servicio de IA y la limpieza elimina el historial propio de forma definitiva.

## ADDED Requirements

### Requirement: Persistencia del historial de conversación
El sistema DEBE persistir cada turno completado de la conversación del chatbot (mensaje del usuario y respuesta del asistente) asociado al usuario autenticado, con su rol y contenido. Un turno DEBE persistirse únicamente cuando el servicio de IA respondió exitosamente. La consulta del historial DEBE devolver los mensajes propios en orden cronológico ascendente.

#### Scenario: Turno guardado tras respuesta
- **WHEN** el usuario autenticado envía una pregunta y el servicio de IA responde
- **THEN** quedan persistidos tanto su mensaje como la respuesta del asistente asociados a su cuenta

#### Scenario: Turno incompleto descartado
- **WHEN** el usuario autenticado envía una pregunta y el servicio de IA no está disponible
- **THEN** el backend responde 502 con `El asistente no está disponible en este momento` y no se persiste ningún mensaje del turno

### Requirement: Consulta del historial propio
El backend DEBE exponer `GET /api/chat/messages` que requiera autenticación JWT y devuelva únicamente los mensajes del usuario autenticado en orden cronológico. Un usuario NUNCA DEBE recibir mensajes de otro usuario.

#### Scenario: Historial disponible tras recargar
- **WHEN** el usuario autenticado recarga la aplicación luego de mantener una conversación
- **THEN** `GET /api/chat/messages` devuelve la conversación completa propia

#### Scenario: Aislamiento del historial
- **WHEN** dos usuarios autenticados mantienen conversaciones distintas y consultan sus historiales
- **THEN** cada uno recibe exclusivamente sus propios mensajes

### Requirement: Envío de mensaje vía backend
El backend DEBE exponer `POST /api/chat/messages` que requiera autenticación JWT, valide el campo `message` (obligatorio y no vacío; si falta o está vacío DEBE responder 400 con un mensaje en español), invoque el servicio de IA reenviando el token del usuario junto con los últimos turnos persistidos como historial, y devuelva la respuesta del asistente. El backend DEBE invocar al servicio de IA mediante una URL configurable por variable de entorno.

#### Scenario: Pregunta enviada por la ruta unificada
- **WHEN** el usuario autenticado envía una pregunta mediante `POST /api/chat/messages`
- **THEN** recibe la respuesta generada por el servicio de IA considerando sus datos financieros

#### Scenario: Mensaje vacío rechazado
- **WHEN** el usuario autenticado envía `message` vacío o ausente a `POST /api/chat/messages`
- **THEN** el backend responde 400 con el mensaje de validación en español sin invocar al servicio de IA

### Requirement: Limpieza del historial propio
El backend DEBE exponer `DELETE /api/chat/messages` que requiera autenticación JWT y elimine permanentemente todos los mensajes del usuario autenticado sin afectar conversaciones de otros usuarios.

#### Scenario: Historial eliminado
- **WHEN** el usuario autenticado solicita eliminar su historial
- **THEN** una consulta posterior de su historial devuelve vacío y las conversaciones de otros usuarios permanecen intactas
