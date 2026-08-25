# Tasks: ai-financial-advice

## 1. Setup y contenido

- [x] 1.1 Crear branch `feature/ai-financial-advice`, issue en GitHub y mover ítem del board #3 a `In Progress` (vía agente git)
- [x] 1.2 Crear `ai/knowledge/` con 5 archivos .md: `presupuesto.md`, `ahorro.md`, `deuda.md`, `inversiones.md`, `emergencia.md`
- [x] 1.3 `ai/app/config.py`: `KNOWLEDGE_DIR`, `KNOWLEDGE_LIMIT` (default 4)
- [x] 1.4 Verificar `ai/Dockerfile` para confirmar que `COPY` incluye el directorio `knowledge/`; si no, agregar `COPY knowledge ./knowledge`

## 2. KnowledgeIndex

- [x] 2.1 `ai/app/knowledge.py`: `KnowledgeIndex` (build_knowledge_documents con fragmentación por headings `##`, fingerprint SHA-256, retrieve, clear)
- [x] 2.2 `ai/app/indexer.py`: función `retrieve_combined(user_id, question)` que concatena user_index.retrieve + knowledge_index.retrieve
- [x] 2.3 `ai/app/main.py`: inyectar `knowledge_index` en chatbot_message, usar `retrieve_combined` en vez de `user_index.retrieve`
- [x] 2.4 `ai/app/chat.py`: system prompt con regla "Consejo financiero" para distinguir documentos de conocimiento de datos del usuario

## 3. Tests

- [x] 3.1 Tests de `KnowledgeIndex`: fingerprint rebuild, fragmentación, retrieve, directorio vacío
- [x] 3.2 Tests de `retrieve_combined`: documentos del usuario + conocimiento, límite de conocimiento respetado
- [x] 3.3 Tests de `build_reply`: documentos de conocimiento marcados con prefijo en el prompt
- [x] 3.4 Suite pytest completa verde (`.\.venv\Scripts\python.exe -m pytest -q`)

## 4. Verificación E2E

- [x] 4.1 Smoke E2E: pregunta sobre presupuesto → respuesta incluye consejo general
- [x] 4.2 Smoke E2E: pregunta sobre gasto propio → responde con dato del usuario
- [x] 4.3 Verificación final de capas

## 5. Cierre

- [x] 5.1 Validación visual del usuario
- [ ] 5.2 Sync de specs, archive del change, PR mergeado con cierre de issue y board `Done` (vía agente git)
