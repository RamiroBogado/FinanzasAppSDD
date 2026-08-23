# Proposal: ai-chatbot

## Why

El producto prevé un chatbot de inteligencia artificial que permita a cada usuario consultar sus datos financieros en lenguaje natural. El servicio `ai/` existe solo como esqueleto con `/health`; implementar el chatbot RAG convierte ese esqueleto en la funcionalidad prevista, respetando el mismo aislamiento y autorización que el backend.

## What Changes

- Autenticación JWT en el servicio de IA: valida el mismo token HS256 que el backend mediante `JWT_SECRET`, con errores 401 idénticos en español.
- Acceso de lectura del servicio de IA a la base SQLite compartida para indexar transacciones, presupuestos y metas del usuario autenticado.
- Pipeline RAG con LangChain + Ollama (`llama3.2` como LLM, `nomic-embed-text` para embeddings): índice vectorial por usuario con similitud coseno sobre `InMemoryVectorStore`, manteniendo `VectorStoreProvider` como abstracción para migrar a ChromaDB más adelante.
- Endpoints `POST /ai/chatbot/message` y `POST /ai/chatbot/clear` protegidos por JWT.
- Infraestructura: variables `JWT_SECRET` y `DB_PATH` en compose para el servicio `ai`, montaje del volumen de datos y pull inicial de modelos Ollama.
- Interfaz: widget flotante de chat disponible en toda la app autenticada, con historial visual, envío, limpieza de conversación e indicador de carga; textos en español.

## Capabilities

### New Capabilities

- `chatbot`: chat RAG sobre los datos financieros del usuario autenticado, expuesto por API del servicio de IA y por widget flotante en la interfaz.

## Impact

- **ai/**: `requirements.txt` (+3 dependencias), `config.py`, nuevo `auth.py`, `data.py`, `indexer.py`, `chat.py`, `main.py`, tests.
- **docker-compose.yml**: entorno y volumen para `ai`, servicio one-shot de pull de modelos.
- **frontend/**: helpers en `src/api.js`, componente flotante en `AppLayout.jsx`.
- **backend/**: sin cambios de código ni esquema.
