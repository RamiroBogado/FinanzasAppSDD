# Tasks: chat-history

## 1. Setup

- [x] 1.1 Crear branch `feature/chat-history`, issue en GitHub y mover ítem del board #3 a `In Progress` (vía agente git)

## 2. Backend: persistencia y proxy

- [x] 2.1 `src/schema.js`: tabla `chat_messages` (id, user_id, role con CHECK user/assistant, content, created_at) + índice por usuario
- [x] 2.2 `src/config.js`: `AI_SERVICE_URL` (default `http://localhost:3002`)
- [x] 2.3 Helper `src/chat.js`: listado acotado (200) ascendente, guardado de turno en transacción, borrado propio
- [x] 2.4 Router `src/routes/chat.js` en `/api/chat`: GET/POST/DELETE con JWT; POST valida mensaje (400 en español), arma historial reciente (últimos 10), llama a la IA con fetch reenviando el Authorization del usuario, 502 `El asistente no está disponible en este momento` si falla sin persistir, persiste pregunta+respuesta al éxito
- [x] 2.5 Montar router en `src/app.js`
- [x] 2.6 Tests vitest `test/chat.test.js`: 401 sin token, 400 mensaje vacío/ausente sin llamar a la IA, turno persistido tras respuesta (fetch de IA simulado), aislamiento entre dos usuarios, DELETE borra solo lo propio, 502 cuando la IA falla sin persistir; suite completa verde (`npm test`) + `npm run lint`

## 3. Servicio IA: memoria conversacional

- [x] 3.1 `app/config.py`: `CHAT_HISTORY_LIMIT` (default 10)
- [x] 3.2 `app/main.py`: modelo `ChatTurn` (role user|assistant, content no vacío) y campo `history` opcional validado; recorte a los últimos `CHAT_HISTORY_LIMIT`; error en español ante turnos inválidos
- [x] 3.3 `app/chat.py`: `build_reply(question, documents, history)` incorpora el diálogo previo al prompt para resolver seguimientos sin inventar datos; `num_ctx=4096` en el LLM
- [x] 3.4 Tests pytest: request sin historial responde igual que antes, historial válido llega íntegro a build_reply, recorte al límite, turnos inválidos rechazados, endpoint sigue autenticando; suite verde

## 4. Frontend

- [x] 4.1 `src/api.js`: `listChatMessages`, `sendChatMessage`, `clearChatMessages` contra `/api/chat/*`; eliminar `askChatbot`, `clearChatbot` y `aiRequest` si queda sin usos
- [x] 4.2 `src/components/ChatWidget.jsx`: carga historial al abrirse (indicador breve), saludo inicial solo sin historial, envío vía backend reemplazando el par user/asistente con la respuesta, "Limpiar conversación" hace DELETE y vuelve al saludo, textos en español
- [x] 4.3 `npm run lint` + `npm run build` verdes en frontend

## 5. Docker y verificación E2E

- [x] 5.1 `docker-compose.yml`: `AI_SERVICE_URL=http://ai:3002` en el servicio backend
- [x] 5.2 Rebuild `docker compose up -d --build` y smoke E2E: login → preguntar → recargar token/cliente y verificar que GET devuelve la conversación → pregunta de seguimiento ambigua respondida con contexto ("¿y cuánto fue en total?" tras otra pregunta) → limpiar → GET vacío → segundo usuario no ve la conversación del primero
- [x] 5.3 Verificación final de capas: backend lint+test, ai pytest, frontend lint+build

## 6. Cierre

- [x] 6.1 Validación visual del usuario del chatbot persistente
- [ ] 6.2 Sync de specs, archive del change, PR mergeado con cierre de issue y board `Done` (vía agente git)
