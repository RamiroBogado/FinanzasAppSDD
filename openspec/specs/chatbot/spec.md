# chatbot Specification

## Purpose

Permite que cada usuario converse en lenguaje natural con un asistente que responde sobre SUS datos financieros (transacciones, presupuestos y metas) mediante un pipeline RAG local, sin exponer nunca información de otros usuarios.

## Requirements

### Requirement: Autenticación del servicio de IA
El servicio de IA DEBE exigir un token JWT válido, firmado con el mismo secreto que el backend, en cualquier endpoint de chatbot. Sin token DEBE responder 401 con `No autorizado`; con token inválido o expirado DEBE responder 401 con `Token inválido o expirado`.

#### Scenario: Acceso sin token
- **WHEN** se invoca cualquier endpoint de chatbot sin encabezado Authorization
- **THEN** el servicio responde 401 con el error `No autorizado`

#### Scenario: Token inválido
- **WHEN** se invoca cualquier endpoint de chatbot con un token malformado o expirado
- **THEN** el servicio responde 401 con el error `Token inválido o expirado`

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

### Requirement: Contexto limitado al usuario autenticado
El índice de recuperación DEBE construirse con transacciones, presupuestos y metas del usuario autenticado. Una consulta NUNCA DEBE recuperar información financiera perteneciente a otro usuario. Además de los datos financieros propios, el servicio PUEDE incluir documentos de conocimiento general del asistente financiero (consejos de presupuesto, ahorro, deudas, inversiones y fondo de emergencia) que NO DEBEN contener datos personales de ningún usuario.

#### Scenario: Datos de otro usuario excluidos
- **WHEN** dos usuarios autenticados preguntan por sus movimientos habiendo registrado datos distintos
- **THEN** cada respuesta se basa únicamente en los datos propios y ninguna respuesta incluye datos del otro usuario

#### Scenario: Consejos generales incluidos
- **WHEN** el usuario pregunta sobre un tema financiero general (presupuesto, ahorro, deudas) y existen documentos de conocimiento relevantes
- **THEN** la respuesta puede incluir orientación general basada en los documentos de conocimiento, sin mezclar datos de otros usuarios

### Requirement: Limpieza del contexto conversacional
El servicio DEBE exponer `POST /ai/chatbot/clear` que elimine el contexto conversacional asociado al usuario autenticado, incluyendo los documentos indexados del usuario en el almacén vectorial persistente cuando el proveedor configurado lo soporte, y responda confirmación exitosa. La limpieza de un usuario NUNCA DEBE afectar los datos indexados de otro usuario.

#### Scenario: Contexto eliminado
- **WHEN** el usuario autenticado solicita limpiar su conversación
- **THEN** el servicio responde éxito y el contexto previo deja de influir en respuestas futuras

#### Scenario: Datos persistentes del usuario eliminados
- **WHEN** el usuario autenticado limpia su conversación tras haber consultado con datos indexados y el proveedor vectorial persistente está activo
- **THEN** los documentos indexados propios dejan de existir en el almacén persistente y una consulta posterior se re-indexa desde sus datos actuales

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

### Requirement: Memoria conversacional acotada
La respuesta del asistente DEBE considerar como máximo una cantidad acotada de turnos previos definida por configuración del servicio de IA. Los turnos excedentes NO DEBEN influir en la respuesta. El comportamiento del servicio DEBE seguir siendo stateless entre requests: el historial llega en cada consulta y no se almacena en el servicio de IA.

#### Scenario: Historial recortado
- **WHEN** se envía una cantidad de turnos previos mayor a la máxima configurada
- **THEN** solo los turnos más recientes dentro del máximo pueden influir en la respuesta

#### Scenario: Servicio stateless
- **WHEN** dos consultas consecutivas llegan sin historial después de una conversación extensa
- **THEN** la segunda consulta se responde sin depender de estado interno del servicio de IA

### Requirement: Persistencia del índice vectorial
Cuando el proveedor de almacenamiento vectorial persistente esté configurado, el índice de recuperación DEBE sobrevivir reinicios del servicio de IA. Tras un reinicio con datos financieros sin cambios, el servicio NO DEBE volver a generar los embeddings ya persistidos para responder consultas del usuario. El aislamiento por usuario DEBE mantenerse en el almacén persistente: los documentos de un usuario NUNCA DEBEN estar accesibles desde la consulta de otro.

#### Scenario: Índice disponible tras reiniciar
- **WHEN** el servicio de IA se reinicia con el proveedor persistente activo y el usuario autenticado realiza una consulta sin cambios en sus datos financieros
- **THEN** la respuesta se genera a partir del índice persistido sin reconstruirlo ni regenerar sus embeddings

#### Scenario: Re-indexación ante datos nuevos
- **WHEN** el servicio de IA se reinicia con el proveedor persistente activo y los datos financieros del usuario cambiaron respecto del índice persistido
- **THEN** el índice del usuario se reconstruye con los datos vigentes antes de responder

#### Scenario: Aislamiento persistente
- **WHEN** dos usuarios autenticados consultan con el proveedor persistente activo
- **THEN** cada consulta recupera únicamente documentos indexados del propio usuario

### Requirement: Proveedor de almacenamiento vectorial configurable
El servicio DEBE seleccionar el proveedor de almacenamiento vectorial mediante configuración por variable de entorno. El modo en memoria DEBE ser el valor por defecto y el despliegue con Docker DEBE usar el proveedor persistente ChromaDB. Los embeddings DEBEN seguir generándose con Ollama y NO DEBE dependerse de un modelo de embeddings distinto provisto por el almacén. Un cambio de proveedor NO DEBE alterar el contrato de los endpoints de chatbot.

#### Scenario: Modo en memoria por defecto
- **WHEN** el servicio arranca sin configuración explícita de proveedor vectorial
- **THEN** el índice opera en memoria manteniendo el comportamiento actual

#### Scenario: Proveedor persistente en Docker
- **WHEN** el servicio arranca en el despliegue con Docker Compose
- **THEN** usa ChromaDB persistente en un volumen dedicado y responde las mismas operaciones de chatbot sin cambios de contrato
