# Proposal: ai-vector-store

## Why

El índice vectorial del chatbot vive únicamente en memoria: cada reinicio del contenedor de IA descarta todos los embeddings y obliga a re-generarlos con Ollama para cada usuario que consulte, desperdiciando cómputo y demorando la primera respuesta. La arquitectura ya prevé esta migración mediante la abstracción `VectorStoreProvider`.

## What Changes

- Nueva implementación `ChromaVectorStore` de `VectorStoreProvider` sobre ChromaDB persistente (`PersistentClient`), con una colección por usuario que preserva el aislamiento existente.
- Fábrica `create_vector_store()` seleccionada por configuración (`VECTOR_STORE`: `memory` por defecto en desarrollo/tests, `chroma` en el despliegue Docker); los embeddings siguen generándose con Ollama y se pasan explícitos a Chroma.
- Persistencia del fingerprint de datos en los metadatos de la colección: tras reiniciar el servicio con datos sin cambios NO se vuelve a indexar (sin re-embeddings).
- `UserIndex` deja de instanciar `InMemoryVectorStore` directamente y usa la fábrica; endpoints `/ai/chatbot/*` sin cambios.
- Docker: volumen nuevo `chroma_data` montado en el servicio `ai` y variable `VECTOR_STORE=chroma`.
- Nueva dependencia `chromadb` en `ai/requirements.txt`.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `chatbot`: el índice de recuperación pasa a ser persistente y configurable por proveedor; sobrevive reinicios del servicio sin re-indexar datos sin cambios; la limpieza elimina también la data persistida del usuario manteniendo el aislamiento.

## Impact

- **ai**: `app/vectorstore.py` (nuevo provider Chroma + fábrica), `app/indexer.py` (fábrica + fingerprint persistido), `app/config.py` (`VECTOR_STORE`, `CHROMA_PATH`), `requirements.txt` (+`chromadb`); tests pytest nuevos.
- **docker-compose.yml**: volumen `chroma_data` y variables de entorno del servicio `ai`.
- **Sin cambios**: backend Node, frontend, endpoints existentes del chatbot, modelos de Ollama.
