# Tasks: ai-vector-store

## 1. Setup

- [x] 1.1 Crear branch `feature/ai-vector-store`, issue en GitHub y mover ítem del board #3 a `In Progress` (vía agente git)

## 2. Proveedor vectorial ChromaDB (`ai/`)

- [x] 2.1 Agregar `chromadb` a `ai/requirements.txt` e instalarlo en el entorno local
- [x] 2.2 `app/config.py`: `VECTOR_STORE` (default `memory`) y `CHROMA_PATH` (default `./chroma_data`)
- [x] 2.3 `app/vectorstore.py`: implementar `ChromaVectorStore` (PersistentClient, colección por namespace, upsert, query, clear) y `create_vector_store(namespace)` con import perezoso y error ante valor inválido
- [x] 2.4 `app/indexer.py`: `UserIndex` usa la fábrica; fingerprint persistido en metadata de colección para omitir re-indexación tras reinicio sin cambios
- [x] 2.5 Tests pytest: unitarios de `ChromaVectorStore` (ranking, idempotencia, clear, persistencia entre instancias, aislamiento por namespace), test de fábrica por env y de fingerprint persistido; suite completa verde

## 3. Despliegue Docker

- [x] 3.1 `docker-compose.yml`: volumen `chroma_data`, env `VECTOR_STORE=chroma` y `CHROMA_PATH=/app/chroma` en servicio `ai`
- [x] 3.2 Rebuild `docker compose up -d --build` y smoke E2E: login → consulta al chatbot respondida con datos → reinicio del servicio `ai` → nueva consulta sin re-indexación (fingerprint vigente) → `clear` elimina la data persistida

## 4. Verificación y cierre

- [x] 4.1 `ai`: `.\.venv\Scripts\python.exe -m pytest -q` completo + lint/format si corresponde
- [x] 4.2 Validación visual del usuario del chatbot tras el rebuild
- [x] 4.3 Archive del change, sync de specs, PR mergeado, issue cerrada y board `Done` (vía agente git)
