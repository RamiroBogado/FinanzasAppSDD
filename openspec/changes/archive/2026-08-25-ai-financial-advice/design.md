# Design: ai-financial-advice

## Context

El chatbot RAG existente recupera documentos exclusivamente del índice por usuario (`UserIndex` en `ai/app/indexer.py`). Para incorporar conocimiento general se necesita un segundo índice de solo lectura compartido entre todos los usuarios, y una estrategia de combinación de ambos resultados antes de construir el prompt.

## Goals / Non-Goals

**Goals:**
- Enriquecer las respuestas del asistente con consejos financieros generales.
- Mantener el aislamiento: documentos de conocimiento no contienen datos personales.
- Re-indexado automático cuando cambian los archivos markdown.
- Sin nuevos dependencias externas: reutiliza ChromaDB y LangChain existentes.

**Non-Goals:**
- Editor de contenido en UI (contenido gestionado por commit en el repo).
- Embeddings de documentos externos a markdown.
- Versióning de documentos dentro de Chroma.

## Decisions

### D1: Fuente de verdad — archivos markdown en el repo

Archivos `.md` en `ai/knowledge/`, uno por tema, contenido en español. Se indexan al iniciar el servicio. El contenido se versiona con git y se edita mediante commits. No se agrega UI ni API para gestionarlos.

**Alternativa descartada:** Tabla en la base de datos con CRUD admin — demasiado alcance para el beneficio.

### D2: KnowledgeIndex — módulo nuevo `ai/app/knowledge.py`

Clase `KnowledgeIndex` singleton (patrón similar a `UserIndex`):
- `build_knowledge_documents(knowledge_dir)`: lee todos los `.md` del directorio, los parte por headings `##` en fragmentos, cada fragmento se convierte en documento de texto.
- `get_fingerprint(knowledge_dir)`: calcula SHA-256 del contenido concatenado de todos los archivos.
- `retrieve(question, limit)`: si el fingerprint cambió, reconstruye la colección; luego consulta por similitud semántica.
- `clear()`: elimina la colección completa.

**Singleton global** (no por usuario): una sola instancia compartida para todos los requests.

### D3: Colección ChromaDB — namespace `knowledge`

El namespace `"knowledge"` se traduce a colección `finanzas-knowledge` vía la fábrica `create_vector_store`. Se almacena en el mismo volumen `chroma_data` que las colecciones de usuarios, pero con nombre distinto. El fingerprint se persiste en metadata de la colección (mismo mecanismo que `UserIndex`).

### D4: Fragmentación por headings

Cada archivo `.md` se parte por headings `##`. Cada fragmento se convierte en un documento de Chroma. Esto permite recuperación más granular: si el usuario pregunta sobre ahorro, se recupera solo la sección relevante del archivo `ahorro.md`, no el documento completo.

Formato del documento: `"Consejo financiero ({tema}): {contenido del fragmento}"`. El prefijo `"Consejo financiero"` permite al modelo distinguirlo de datos del usuario.

### D5: Retrieval combinado

Función `retrieve_combined(user_id, question)` en `ai/app/indexer.py`:
```
user_docs = user_index.retrieve(user_id, question, limit=6)
knowledge_docs = knowledge_index.retrieve(question, limit=KNOWLEDGE_LIMIT)
return user_docs + knowledge_docs
```

Límite total: 6 (usuario) + 4 (conocimiento) = 10 documentos máximo. El límite de usuario se mantiene en `RETRIEVAL_LIMIT` (8 por defecto, pero se usa 6 para dejar espacio al conocimiento).

**Alternativa descartada:** Merge por score de similitud — `VectorStoreProvider.query()` solo devuelve strings sin scores, requeriría extender la interfaz.

### D6: System prompt — regla para documentos de conocimiento

Se agrega una regla al `SYSTEM_PROMPT` en `ai/app/chat.py`:

> "Cuando el contexto contenga documentos que comienzan con 'Consejo financiero', úsalos como guía orientativa general. Los montos, fechas y datos específicos del usuario salen SOLO de los documentos que NO comienzan con 'Consejo financiero'. Nunca mezcles datos de otros usuarios."

### D7: Configuración

En `ai/app/config.py`:
```python
KNOWLEDGE_DIR = os.getenv("KNOWLEDGE_DIR", os.path.join(os.path.dirname(__file__), '..', 'knowledge'))
KNOWLEDGE_LIMIT = int(os.getenv("KNOWLEDGE_LIMIT", '4'))
```

### D8: Docker — sin cambios

El Dockerfile existente de `ai/` ejecuta `COPY src ./src` y `COPY app ./app`. Los archivos markdown en `ai/knowledge/` se copian al imagen porque están fuera de `src/` y `app/`. Se necesita verificar que el `COPY` existente los incluye; si no, agregar una línea `COPY knowledge ./knowledge` al Dockerfile.

**Verificación:** revisar `ai/Dockerfile`.

## Risks

- **Latencia adicional:** Consultar dos colecciones en vez de una agrega ~10-50ms (ChromaDB local). Negligible comparado con la llamada a Ollama (~5s).
- **Contenido estático:** Los consejos no se actualizan sin redeploy. Aceptable para contenido curado que cambia raramente.
- **Fragmentación por headings:** Si un `.md` no tiene headings `##`, el archivo completo es un solo fragmento. Funciona pero es menos granular.
