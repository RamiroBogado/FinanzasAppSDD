# chatbot Specification

## MODIFIED Requirements

### Requirement: Endpoint de mensajes del chatbot
El servicio DEBE exponer `POST /ai/chatbot/message` que reciba `message` (texto obligatorio no vacío; si falta o está vacío DEBE responder 400 con un mensaje en español) y un `history` OPCIONAL con turnos previos de la conversación, y responda `reply` en español generado a partir de los datos recuperados y del historial recibido. El servicio DEBE validar cada turno del historial recibido y DEBE recortarlo a una cantidad acotada de turnos antes de usarlo. El servicio NUNCA DEBE inventar datos que no estén en el contexto recuperado ni en el historial: ante falta de información relevante DEBE indicar que no tiene datos suficientes.

#### Scenario: Pregunta respondida con datos propios
- **WHEN** el usuario autenticado pregunta por sus gastos registrados habiendo creado transacciones propias
- **THEN** la respuesta menciona información consistente con esas transacciones

#### Scenario: Mensaje vacío rechazado
- **WHEN** el usuario autenticado envía `message` vacío o ausente
- **THEN** el servicio responde 400 con el mensaje de validación en español

#### Scenario: Seguimiento con memoria conversacional
- **WHEN** el usuario autenticado envía una pregunta acompañada de un historial previo y luego formula una pregunta de seguimiento ambigua por sí sola
- **THEN** la respuesta del seguimiento es coherente con los turnos previos recibidos

#### Scenario: Consulta sin historial sigue funcionando
- **WHEN** el usuario autenticado envía una pregunta sin campo `history`
- **THEN** el servicio responde igual que antes de incorporar historial

### Requirement: Widget flotante de chat
La interfaz autenticada DEBE mostrar un botón flotante de chat disponible en todas las páginas de la aplicación protegida que abra un panel de conversación con historial visual cargado desde la API del backend al abrirse, campo de texto para preguntar, envío de mensajes e indicador de espera mientras se genera la respuesta. Cuando no exista historial persistido el panel DEBE mostrar el saludo inicial. El envío y la limpieza DEBEN realizarse contra la API del backend y NO contra llamadas directas al servicio de IA. El panel DEBE permitir limpiar la conversación mediante `Limpiar conversación`, lo que elimina el historial persistido del usuario, y los fallos DEBEN mostrarse con el mensaje devuelto por la API. Los textos visibles DEBEN estar en español y el widget DEBE funcionar en claro/oscuro y mobile.

#### Scenario: Conversación desde el widget
- **WHEN** el usuario autenticado abre el widget, escribe una pregunta sobre sus finanzas y la envía
- **THEN** el panel muestra su pregunta y la respuesta del asistente con un indicador de espera mientras se genera

#### Scenario: Limpieza desde el widget
- **WHEN** el usuario autenticado presiona `Limpiar conversación`
- **THEN** el panel borra el historial visible, muestra nuevamente el saludo inicial y el historial queda eliminado en el backend

#### Scenario: Historial restaurado al abrir
- **WHEN** el usuario autenticado que ya mantuvo una conversación recarga la página y abre el widget
- **THEN** el panel muestra su conversación previa tal como quedó persistida

#### Scenario: Saludo inicial sin historial
- **WHEN** el usuario autenticado sin conversaciones previas abre el widget
- **THEN** el panel muestra únicamente el saludo inicial del asistente

## ADDED Requirements

### Requirement: Memoria conversacional acotada
La respuesta del asistente DEBE considerar como máximo una cantidad acotada de turnos previos definida por configuración del servicio de IA. Los turnos excedentes NO DEBEN influir en la respuesta. El comportamiento del servicio DEBE seguir siendo stateless entre requests: el historial llega en cada consulta y no se almacena en el servicio de IA.

#### Scenario: Historial recortado
- **WHEN** se envía una cantidad de turnos previos mayor a la máxima configurada
- **THEN** solo los turnos más recientes dentro del máximo pueden influir en la respuesta

#### Scenario: Servicio stateless
- **WHEN** dos consultas consecutivas llegan sin historial después de una conversación extensa
- **THEN** la segunda consulta se responde sin depender de estado interno del servicio de IA
