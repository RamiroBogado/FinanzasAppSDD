# Proposal: chat-history

## Why

La conversación del asistente financiero vive únicamente en el estado del componente `ChatWidget`: al recargar la página o cerrar sesión el historial desaparece, y cada pregunta se responde sin memoria de los turnos anteriores. El usuario pidió que las conversaciones se conserven al reiniciar la página y que el asistente recuerde el hilo para responder preguntas de seguimiento.

## What Changes

- El backend persiste los mensajes del chatbot por usuario en una nueva tabla `chat_messages` y expone `GET /api/chat/messages`, `POST /api/chat/messages` y `DELETE /api/chat/messages`.
- `POST /api/chat/messages` actúa como proxy: valida el mensaje, arma el historial reciente del usuario, invoca el servicio de IA reenviando su JWT, guarda la pregunta y la respuesta de forma atómica solo si la IA respondió, y devuelve la respuesta.
- Si el servicio de IA no responde, el backend devuelve 502 con un error en español y NO persiste el turno incompleto.
- El servicio de IA acepta un `history` opcional (últimos turnos) en `POST /ai/chatbot/message` y lo incorpora al prompt para responder con contexto conversacional; sigue siendo stateless entre requests.
- El widget de chat carga el historial persistido desde el backend al abrirse, muestra el saludo inicial solo cuando no hay historial, y "Limpiar conversación" borra el historial en el backend.
- Se retiran las llamadas directas del frontend al servicio de IA: todo pasa por el backend.

## Capabilities

### New Capabilities

- `chat-history`: persistencia y aislamiento del historial de conversación del chatbot por usuario autenticado, con endpoints de lectura, envío (proxy a IA) y limpieza.

### Modified Capabilities

- `chatbot`: el endpoint de mensajes acepta historial previo para responder con memoria conversacional acotada; la limpieza del contexto se reconcilia con el borrado del historial persistido; el widget flotante carga el historial persistente y delega la limpieza en el backend.

## Impact

- **backend/**: nueva tabla `chat_messages` en `src/schema.js`, nuevas rutas `src/routes/chat.js` montadas en `/api/chat`, configuración `AI_SERVICE_URL` en `src/config.js`, tests vitest nuevos.
- **ai/**: modelo de request con `history` opcional validado y recortado, `build_reply(question, documents, history)` con prompt multi-turno, ajuste de ventana de contexto de Ollama, tests pytest nuevos.
- **frontend/**: `src/api.js` reemplaza `askChatbot`/`clearChatbot` por los endpoints del backend; `ChatWidget.jsx` carga historial y limpia vía API.
- **docker-compose.yml**: variable `AI_SERVICE_URL=http://ai:3002` en el servicio backend.
- Sin cambios de dependencias nuevas: el backend usa `fetch` global de Node 22.
- Endpoints existentes de IA (`POST /ai/chatbot/message`, `POST /ai/chatbot/clear`) conservan compatibilidad: `history` es opcional.
