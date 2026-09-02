# Proposal: chatbot-actions

## Why

El asistente financiero actual puede responder consultas sobre los datos del usuario, pero no puede ejecutar las operaciones que el usuario ya realiza desde la interfaz. Para registrar un gasto, modificar un presupuesto o actualizar una meta, el usuario debe abandonar la conversación y completar el formulario correspondiente. Se necesita ampliar el chatbot para que interprete instrucciones en lenguaje natural y pueda gestionar los recursos ya disponibles, sin convertir al modelo de IA en una vía de acceso directo a los datos financieros.

## What Changes

- El chatbot interpreta solicitudes en lenguaje natural y devuelve una propuesta estructurada para consultar recursos, navegar a una sección o realizar una operación disponible para el usuario autenticado.
- Las operaciones que crean, modifican o eliminan datos requieren una confirmación explícita desde el widget antes de ejecutarse. La confirmación queda asociada al usuario, vence en un tiempo acotado, se puede usar una sola vez y es idempotente.
- El backend conserva la autoridad de ejecución: revalida los datos de la propuesta y reutiliza las reglas de negocio, autorización y aislamiento existentes para transacciones, categorías, presupuestos, metas y alertas. El servicio de IA no escribe directamente en SQLite.
- El chatbot resuelve referencias a recursos propios mediante consultas filtradas por el usuario autenticado. Si una instrucción identifica más de un recurso o no aporta los datos obligatorios, solicita una aclaración en lugar de proponer una acción riesgosa.
- El widget presenta propuestas de escritura con un resumen legible y las acciones `Confirmar` y `Cancelar`; muestra el resultado de la ejecución y enlaces de navegación o descarga cuando corresponda.
- Las acciones confirmadas se registran para auditoría con su usuario, tipo, fecha y resultado, sin guardar secretos ni ampliar los permisos de la sesión.
- El alcance cubre únicamente las capacidades ya implementadas para una sesión autenticada: transacciones, categorías, presupuestos, metas, alertas y exportación de transacciones. No incluye registro, login, recuperación o cambio de contraseña, ni opciones de configuración que actualmente no están implementadas.

## Capabilities

### New Capabilities

- `chatbot-actions`: propuestas y confirmaciones seguras para que el asistente financiero consulte y ejecute las acciones autenticadas ya disponibles en la aplicación.

### Modified Capabilities

- `chatbot`: el endpoint de conversación incorpora la interpretación de intenciones y la representación de propuestas de acción, preservando sus respuestas RAG para consultas informativas.
- `chat-history`: los turnos del chat pueden reflejar propuestas, confirmaciones, cancelaciones y resultados de acciones sin perder el historial aislado del usuario.
- `transactions`: las operaciones existentes pueden iniciarse mediante una propuesta confirmada del chatbot, conservando sus validaciones y autorización actuales.
- `categories`: las operaciones existentes pueden iniciarse mediante una propuesta confirmada del chatbot, conservando sus validaciones y autorización actuales.
- `budgets`: las operaciones existentes pueden iniciarse mediante una propuesta confirmada del chatbot, conservando sus validaciones y autorización actuales.
- `goals`: las operaciones existentes pueden iniciarse mediante una propuesta confirmada del chatbot, conservando sus validaciones y autorización actuales.
- `alerts`: la consulta y el marcado de alertas existentes pueden iniciarse desde el chatbot, conservando sus validaciones y autorización actuales.

## Impact

- **backend/**: nuevas estructuras persistentes para propuestas pendientes y auditoría de acciones, con creación para instalaciones nuevas y actualización guiada para bases existentes; rutas autenticadas para proponer, confirmar y cancelar acciones; reutilización de servicios de dominio existentes; tests de autorización, expiración, idempotencia, ambigüedad y aislamiento.
- **ai/**: interpretación de intenciones y extracción de parámetros estructurados para acciones soportadas; el modelo solo propone operaciones y nunca escribe en SQLite; tests para solicitudes completas, incompletas y ambiguas.
- **frontend/**: `ChatWidget` muestra tarjetas de propuesta, confirmación/cancelación, resultados, enlaces de navegación y descargas; `api.js` incorpora los contratos del flujo de acciones.
- **Sin dependencias nuevas previstas**: se reutilizan Express, SQLite, FastAPI, LangChain, Ollama y los componentes de interfaz existentes.
- **Cambio de schema SQLite**: sí, para persistir propuestas pendientes y el registro de auditoría, siempre asociado al `user_id` autenticado.
