# chatbot Specification

## Purpose

Permite que cada usuario converse en lenguaje natural con un asistente que responde sobre SUS datos financieros (transacciones, presupuestos y metas) mediante un pipeline RAG local, sin exponer nunca información de otros usuarios.

## ADDED Requirements

### Requirement: Autenticación del servicio de IA
El servicio de IA DEBE exigir un token JWT válido, firmado con el mismo secreto que el backend, en cualquier endpoint de chatbot. Sin token DEBE responder 401 con `No autorizado`; con token inválido o expirado DEBE responder 401 con `Token inválido o expirado`.

#### Scenario: Acceso sin token
- **WHEN** se invoca cualquier endpoint de chatbot sin encabezado Authorization
- **THEN** el servicio responde 401 con el error `No autorizado`

#### Scenario: Token inválido
- **WHEN** se invoca cualquier endpoint de chatbot con un token malformado o expirado
- **THEN** el servicio responde 401 con el error `Token inválido o expirado`

### Requirement: Endpoint de mensajes del chatbot
El servicio DEBE exponer `POST /ai/chatbot/message` que reciba `message` (texto obligatorio no vacío; si falta o está vacío DEBE responder 400 con un mensaje en español) y responda `reply` en español generado a partir de los datos recuperados. El servicio NUNCA DEBE inventar datos que no estén en el contexto recuperado: ante falta de información relevante DEBE indicar que no tiene datos suficientes.

#### Scenario: Pregunta respondida con datos propios
- **WHEN** el usuario autenticado pregunta por sus gastos registrados habiendo creado transacciones propias
- **THEN** la respuesta menciona información consistente con esas transacciones

#### Scenario: Mensaje vacío rechazado
- **WHEN** el usuario autenticado envía `message` vacío o ausente
- **THEN** el servicio responde 400 con el mensaje de validación en español

### Requirement: Contexto limitado al usuario autenticado
El índice de recuperación DEBE construirse únicamente con transacciones, presupuestos y metas del usuario autenticado. Una consulta realizada por un usuario NUNCA DEBE recuperar información financiera perteneciente a otro usuario.

#### Scenario: Datos de otro usuario excluidos
- **WHEN** dos usuarios autenticados preguntan por sus movimientos habiendo registrado datos distintos
- **THEN** cada respuesta se basa únicamente en los datos propios y ninguna respuesta incluye datos del otro usuario

### Requirement: Limpieza del contexto conversacional
El servicio DEBE exponer `POST /ai/chatbot/clear` que elimine el contexto conversacional asociado al usuario autenticado y responda confirmación exitosa.

#### Scenario: Contexto eliminado
- **WHEN** el usuario autenticado solicita limpiar su conversación
- **THEN** el servicio responde éxito y el contexto previo deja de influir en respuestas futuras

### Requirement: Widget flotante de chat
La interfaz autenticada DEBE mostrar un botón flotante de chat disponible en todas las páginas de la aplicación protegida que abra un panel de conversación con historial visual, campo de texto para preguntar, envío de mensajes e indicador de espera mientras se genera la respuesta. El panel DEBE permitir limpiar la conversación mediante `Limpiar conversación` y los fallos DEBEN mostrarse con el mensaje devuelto por la API. Los textos visibles DEBEN estar en español y el widget DEBE funcionar en claro/oscuro y mobile.

#### Scenario: Conversación desde el widget
- **WHEN** el usuario autenticado abre el widget, escribe una pregunta sobre sus finanzas y la envía
- **THEN** el panel muestra su pregunta y la respuesta del asistente con un indicador de espera mientras se genera

#### Scenario: Limpieza desde el widget
- **WHEN** el usuario autenticado presiona `Limpiar conversación`
- **THEN** el panel borra el historial visible y el contexto del servicio se limpia
