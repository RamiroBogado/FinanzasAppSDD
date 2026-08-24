# Design: ai-vector-store

## Context

`ai/app/vectorstore.py` define el ABC `VectorStoreProvider` (`add`, `query`, `clear`) con una única implementación `InMemoryVectorStore` (coseno sobre listas en RAM). `UserIndex` (indexer.py) mantiene un store por usuario en un dict, re-indexa cuando cambia un fingerprint de SQLite y bloquea con un `threading.Lock`. Los embeddings los genera Ollama (`nomic-embed-text`) vía `create_embedder()`. Docker monta `finanzas_data` para la SQLite pero no existe almacenamiento para vectores: cada reinicio del servicio descarta todo el índice.

## Goals / Non-Goals

**Goals:**

- Índice persistente que sobreviva reinicios del contenedor de IA sin re-generar embeddings si los datos no cambiaron.
- Migración transparente vía la abstracción existente: mismos endpoints, mismo aislamiento por usuario.
- Selección de proveedor por configuración, con `memory` como default para desarrollo/tests.

**Non-Goals:**

- Cambiar modelos de Ollama, prompts o el contrato de `/ai/chatbot/*`.
- ChromaDB como servidor independiente (se usa el modo embebido/persistente local).
- Métricas, backups o retención del almacén vectorial.
- Modificar backend Node ni frontend.

## Decisions

### D1 — `ChromaVectorStore` sobre PersistentClient
Nueva clase en `vectorstore.py` que implementa `add/query/clear` con `chromadb.PersistentClient(path=CHROMA_PATH)`. Una colección por usuario (`user-{user_id}`) preserva el aislamiento 1:1 con la semántica actual de `UserIndex._stores`. `add` usa `upsert` (id determinista `{user_id}-{index}`) para que la re-indexación sea idempotente; `query` delega en `collection.query` y devuelve los documentos ordenados por similitud; `clear` borra la colección completa del usuario. Alternativa descartada: colección única con metadata `user_id` — filtra igual pero complica `clear` y aumenta superficie de error por filtros mal aplicados.

### D2 — Embeddings propios, no los del almacén
Los embeddings siguen generándose con Ollama y se pasan explícitos en `upsert`/`query`. Así se evita que Chroma use su función de embedding por defecto (descargaría un modelo ONNX ajeno al stack y duplicaría cómputo), cumpliendo la restricción del contexto de proyecto.

### D3 — Fábrica por configuración
En `config.py`: `VECTOR_STORE = os.getenv("VECTOR_STORE", "memory")` y `CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_data")`. En `vectorstore.py`: `create_vector_store(namespace)` devuelve `ChromaVectorStore(namespace)` si `VECTOR_STORE == "chroma"`, sino `InMemoryVectorStore()`. Import de `chromadb` perezoso (dentro de la clase/fábrica) para que los tests sin Chroma no paguen el costo de import. Valor inválido → fallar fast en arranque con mensaje claro.

### D4 — Fingerprint persistido en metadata de colección
Al crear/reconstruir la colección se guarda `{"fingerprint": <hash>}` en sus metadatos. En `retrieve()`, si existe colección persistida con fingerprint vigente se consulta directo sin re-indexar; si difiere o falta, se reconstruye. Esto convierte la persistencia en beneficio real (arranque en frío sin re-embeddings). El dict `_fingerprints` en memoria deja de ser la única fuente: pasa a respaldarse en la colección. Alternativa descartada: re-indexar siempre tras reinicio — anularía el propósito del change.

### D5 — `UserIndex` usa la fábrica
`_rebuild(user_id)` crea el store vía `create_vector_store(f"user-{user_id}")`; `retrieve()` pregunta primero a la data provider por el fingerprint y decide re-indexar según D4. La lock y la semántica de `clear()` se mantienen idénticas.

### D6 — Dependencia y despliegue
`chromadb` se agrega a `requirements.txt` (justificada: la arquitectura la declara objetivo explícito). En `docker-compose.yml`, servicio `ai`: volumen nuevo `chroma_data:/app/chroma`, env `VECTOR_STORE=chroma` y `CHROMA_PATH=/app/chroma`. Local/dev/tests siguen en `memory` (default), sin tocar `.venv` existente más allá de instalar la dependencia para correr los tests nuevos.

### D7 — Tests
Tests unitarios de `ChromaVectorStore` con `CHROMA_PATH` apuntando a `tmp_path` de pytest (sin servidor): ranking por similitud, upsert idempotente, `clear` elimina la colección, persistencia entre instancias sucesivas y aislamiento por namespace. Test de fábrica (memory default, chroma por env). Tests existentes de indexer/app siguen pasando sin cambios porque el default sigue siendo memoria.

## Risks / Trade-offs

- **Peso de la dependencia**: `chromadb` arrastra transitivas voluminosas (onnxruntime, etc.) → imagen de IA más grande; aceptado por ser el objetivo declarado de arquitectura.
- **Lock global**: `threading.Lock` sigue serializando retrieves; no empeora respecto del status quo y está fuera de alcance.
- **Colecciones huérfanas**: usuarios eliminados dejarían colecciones en disco; el volumen es desechable y `clear` cubre el caso funcional relevante.
