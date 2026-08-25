# Design: chat-history

## Context

El chatbot actual es stateless: `POST /ai/chatbot/message` responde cada pregunta de forma independiente con RAG sobre los datos financieros, y el widget guarda los mensajes en estado de React. El frontend llama directamente al servicio de IA (`/ai/chatbot/message` vía proxy Vite). El backend no conoce la existencia del servicio de IA. El backend usa Node 22 (fetch global disponible), Express con routers por recurso y SQLite mediante better-sqlite3 con schema creado por `CREATE TABLE IF NOT EXISTS`. El servicio de IA valida el mismo JWT que el backend.

## Goals / Non-Goals

**Goals:**
- Historial de conversación persistido por usuario, sobrevive recargas y está disponible desde cualquier navegador.
- Asistente con memoria conversacional para preguntas de seguimiento ("¿y en sueldo?").
- Un único punto de entrada para el chat desde el frontend: el backend.
- Preservar el aislamiento por usuario en las tres capas.

**Non-Goals:**
- Múltiples conversaciones nombradas por usuario (una sola línea de tiempo por usuario).
- Persistir el índice RAG o los documentos recuperados: eso ya lo cubre ai-vector-store.
- Streaming de respuestas.
- Moderación de contenido o límites de cuota por plan.

## Decisions

### D1. Backend como proxy y fuente de verdad
`POST /api/chat/messages` orquesta: valida, arma historial persistido reciente, llama a la IA reenviando el JWT del usuario, y persiste pregunta+respuesta en una transacción única solo si la IA respondió. Alternativas descartadas: (a) frontend persiste ambos mensajes con dos llamadas extra — no atómico y más chattiness; (b) IA escribe en la base compartida — cruza responsabilidades entre capas y duplica autorización.

### D2. Tabla `chat_messages`
`(id INTEGER PK, user_id INTEGER NOT NULL, role TEXT NOT NULL CHECK(role IN ('user','assistant')), content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))` + índice `(user_id, id)`. Creada con `CREATE TABLE IF NOT EXISTS` en `initSchema`, siguiendo la convención del proyecto sin migraciones externas.

### D3. Endpoints del backend
- `GET /api/chat/messages` → últimos 200 propios en orden ascendente.
- `POST /api/chat/messages` `{message}` → 400 si falta/vacío; 502 `El asistente no está disponible en este momento` si la IA falla (sin persistir); 200 `{reply}` tras persistir ambos mensajes.
- `DELETE /api/chat/messages` → borra todos los propios, responde `{status:'ok'}`.
Router nuevo `src/routes/chat.js` montado en `/api/chat`.

### D4. Configuración
- `AI_SERVICE_URL` (default `http://localhost:3002`; Docker: `http://ai:3002`) en `backend/src/config.js`.
- `CHAT_HISTORY_LIMIT` en ai/config.py (default 10): máximo de turnos previos que influyen en la respuesta.

### D5. Memoria multi-turno en la IA
`MessageRequest` gana `history: list[ChatTurn] | None` (`ChatTurn`: `role` literal `'user'|'assistant'`, `content` str no vacío; turnos inválidos → 422/400 en español). El endpoint recorta a los últimos `CHAT_HISTORY_LIMIT` turnos válidos y `build_reply(question, documents, history)` los incorpora al prompt como diálogo previo, instruyendo resolver referencias ambiguas usando ese contexto sin inventar datos financieros. El servicio sigue sin guardar nada entre requests.

### D6. Ventana de contexto de Ollama
Ollama limita `num_ctx` (~2048 default); sumar historial + documentos puede truncar. Se fija `num_ctx=4096` al construir el LLM en `chat.py`, suficiente para RETRIEVAL_LIMIT=8 documentos + 10 turnos.

### D7. Frontend
`api.js`: `listChatMessages(token)`, `sendChatMessage(token, message)`, `clearChatMessages(token)` contra `/api/chat/*` (request normal `/api`). Se eliminan `askChatbot`/`clearChatbot` y, al no quedar otros usos, también el helper `aiRequest`. `ChatWidget`: carga historial al abrirse (estado `loadingHistory`, saludo solo si vacío), envía por el backend y reemplaza el par user/asistente con la respuesta recibida; "Limpiar conversación" hace DELETE y vuelve al saludo.

### D8. Compatibilidad
`history` es opcional en la IA: clientes actuales sin historial siguen funcionando. El widget deja de llamar `POST /ai/chatbot/clear` (limpiar ahora borra historial en backend; el endpoint de IA queda intacto para reiniciar el índice).

## Risks / Trade-offs

- **Latencia extra por el salto backend→IA**: despreciable frente a la generación del LLM (segundos).
- **Historial crece sin límite**: se acota lectura a 200 y memoria a 10 turnos; poda futura fuera de alcance.
- **`num_ctx=4096` aumenta RAM de Ollama**: aceptable; revisable si se sube el límite de turnos.
- **Fallo de IA post-validación**: el turno no se guarda y el usuario ve el error; puede reintentar sin basura en el historial.
