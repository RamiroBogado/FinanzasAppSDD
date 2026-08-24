# chatbot Specification

## MODIFIED Requirements

### Requirement: Limpieza del contexto conversacional
El servicio DEBE exponer `POST /ai/chatbot/clear` que elimine el contexto conversacional asociado al usuario autenticado, incluyendo los documentos indexados del usuario en el almacén vectorial persistente cuando el proveedor configurado lo soporte, y responda confirmación exitosa. La limpieza de un usuario NUNCA DEBE afectar los datos indexados de otro usuario.

#### Scenario: Contexto eliminado
- **WHEN** el usuario autenticado solicita limpiar su conversación
- **THEN** el servicio responde éxito y el contexto previo deja de influir en respuestas futuras

#### Scenario: Datos persistentes del usuario eliminados
- **WHEN** el usuario autenticado limpia su conversación tras haber consultado con datos indexados y el proveedor vectorial persistente está activo
- **THEN** los documentos indexados propios dejan de existir en el almacén persistente y una consulta posterior se re-indexa desde sus datos actuales

## ADDED Requirements

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
