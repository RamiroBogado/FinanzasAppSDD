# Tasks: ai-chatbot

## 1. Setup

- [x] 1.1 Crear rama `feature/ai-chatbot` e issue en board #3 (`@Board FinanzasAppSDD`) con Status `Todo` vía agente git
- [x] 1.2 Agregar `pyjwt`, `langchain-ollama` y `numpy` a `ai/requirements.txt` e instalar en el entorno local

## 2. Servicio de IA

- [x] 2.1 Extender `config.py` con `JWT_SECRET` y `DB_PATH`
- [x] 2.2 Crear `auth.py` con validación JWT (401 en español idénticos al backend)
- [x] 2.3 Crear `data.py` con lectura solo lectura de transacciones, presupuestos y metas por usuario
- [x] 2.4 Evolucionar `vectorstore.py` a similitud coseno con función de embedding inyectable
- [x] 2.5 Crear `indexer.py` con documentos en español y reconstrucción por fingerprint
- [x] 2.6 Crear `chat.py` con prompt RAG y `main.py` con `/chatbot/message` y `/chatbot/clear`
- [x] 2.7 Tests pytest sin Ollama (auth, validaciones, aislamiento con embedding fake, clear) y correr pytest

## 3. Infraestructura

- [x] 3.1 Compose: `JWT_SECRET`, `DB_PATH`, volumen de datos para `ai` y servicio `ollama-init` con pull de modelos

## 4. Frontend

- [x] 4.1 Agregar `askChatbot` y `clearChatbot` en `api.js`
- [x] 4.2 Crear `ChatWidget.jsx` flotante en `AppLayout.jsx` con historial, envío, "Pensando…", `Limpiar conversación`, dark mode y mobile
- [x] 4.3 Correr frontend lint + build

## 5. Verificación y cierre

- [x] 5.1 Rebuild docker, pull de modelos y E2E real: dos usuarios, respuestas basadas en datos propios, aislamiento, clear
- [x] 5.2 Validación visual del usuario en claro/oscuro y mobile
- [ ] 5.3 Archive del change, board `Done`, commit y push vía agente git

## 6. Corrección de razonamiento numérico

- [x] 6.1 Decisión registrada en design.md: modelo `llama3.1:8b`, resúmenes precalculados, formato sin miles, fecha actual en prompt
- [x] 6.2 `config.py`: `OLLAMA_MODEL = "llama3.1:8b"`
- [x] 6.3 `indexer.py`: montos sin separador de miles y documentos de resumen mensual (totales, por categoría con mayor gasto)
- [x] 6.4 `chat.py`: fecha actual y reglas numéricas/comparativas en el prompt
- [x] 6.5 Compose: pull de `llama3.1:8b` en `ollama-init`
- [x] 6.6 Actualizar tests, pytest verde, rebuild docker y E2E del caso real (alquiler vs comida)
