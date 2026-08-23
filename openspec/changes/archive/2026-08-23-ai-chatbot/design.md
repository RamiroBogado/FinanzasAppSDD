# Design: ai-chatbot

## Context

El servicio `ai/` es un esqueleto FastAPI con `/health`, una abstracción `VectorStoreProvider` y un `InMemoryVectorStore` sin embeddings reales. El backend firma JWT HS256 con `JWT_SECRET` (default `finanzasapp-dev-secret`) y persiste en SQLite (`DB_PATH`). Compose ya corre Ollama y expone el proxy `/ai → :3002` en el frontend. El contexto del proyecto habilita que `ai` lea la misma base de datos que el backend.

## Goals / Non-Goals

- Goals: chat RAG por usuario sobre transacciones, presupuestos y metas; mismo aislamiento/autorización que el backend; widget flotante global; tests deterministas sin depender de Ollama.
- Non-Goals: ChromaDB (queda para un change futuro tras la abstracción), streaming de tokens, memoria conversacional del lado servidor más allá del contexto limpio por `clear`, multi-moneda.

## Decisions

### D1. Lectura directa de SQLite compartido

`data.py` abre la base en modo solo lectura (`file:...?mode=ro`, URI) usando `DB_PATH`. Alternativa descartada: llamar HTTP al backend, agrega superficie nueva sin beneficio. El volumen `finanzas_data` se monta en el servicio `ai` de compose.

### D2. Auth JWT compartida

`auth.py` valida HS256 con PyJWT usando `JWT_SECRET` (mismo default que el backend) como dependencia de FastAPI; extrae `sub` como `user_id`. Mensajes 401 idénticos a los del backend.

### D3. Índice vectorial por usuario con embedding inyectable

`InMemoryVectorStore` evoluciona: recibe por constructor una función de embedding (async), guarda vectores junto a documentos y resuelve `query` por similitud coseno (numpy). La firma pública del ABC no cambia, de modo que un futuro proveedor ChromaDB implemente la misma interfaz.

`indexer.py` mantiene un store por `user_id` construido bajo demanda con documentos en español:

- Transacción: `Transacción del 10/08/2026: Gasto de $50000,00 en Comida (Supermercado)`
- Presupuesto: `Presupuesto de Comida para 08/2026: límite $100000,00, gastado $15000,00`
- Meta: `Meta de ahorro Vacaciones: objetivo $500000,00, ahorrado $40000,00, fecha límite 31/12/2026`
- Resumen mensual: `Resumen de agosto/2026: ingresos $X, gastos $Y` y `Gastos por categoría en agosto/2026: Vivienda $800000,00 (mayor gasto), Comida $1400,00`; también `Mayor gasto de agosto/2026: ...`

Los montos se escriben sin separador de miles (`$800000,00`): los modelos chicos parsean mejor ese formato y reduce errores numéricos. Los resúmenes precalculados evitan que el LLM tenga que sumar o comparar montos por su cuenta.

Invalidación: fingerprint barato por usuario (cantidades + máximo id por tabla); si cambia, se reconstruye el índice antes de responder.

### D4. Cadena RAG

`chat.py` arma el prompt del sistema en español con la fecha actual (para resolver "este mes"), reglas de usar solo contexto recuperado, priorizar los documentos de resumen para preguntas de totales/comparaciones, verificar comparaciones numéricas antes de afirmar cuál monto es mayor/menor, nunca inventar montos ni fechas; si el contexto no alcanza, decir que no tiene información suficiente. Recupera top-k documentos (k=8) con la pregunta como consulta e invoca `ChatOllama` (modelo `llama3.1:8b`, elegido sobre `llama3.2` por su mejor razonamiento numérico). Embeddings con `OllamaEmbeddings` (`nomic-embed-text`) vía `langchain-ollama`.

### D5. Endpoints

- `POST /ai/chatbot/message`: body `{message}`; 400 `El mensaje es obligatorio` / `El mensaje no puede estar vacío`; responde `{reply}`.
- `POST /ai/chatbot/clear`: descarta el índice/contexto del usuario; responde `{status: "ok"}`.
- `/health` queda igual.

### D6. Dependencias nuevas (justificación)

- `pyjwt`: validar el JWT del backend en Python; estándar del ecosistema.
- `langchain-ollama`: integraciones oficiales LangChain ↔ Ollama (ChatOllama/OllamaEmbeddings); ya se usa LangChain según convenciones.
- `numpy`: similitud coseno vectorizada; liviana respecto a alternativas.

### D7. Infraestructura

Compose agrega a `ai`: `JWT_SECRET`, `DB_PATH=/app/data/finanzas.db`, volumen `finanzas_data:/app/data` y dependencia con Ollama. Servicio one-shot `ollama-init` hace `pull` de `llama3.1:8b` y `nomic-embed-text` (primera vez descarga ~4,9 GB).

### D8. Widget flotante

`ChatWidget.jsx` montado dentro de `AppLayout` (solo zona autenticada): botón fijo abajo-derecha (icono MessageCircle) que abre panel fijo de ~380px con lista de mensajes, estado "Pensando…" durante la llamada, botón enviar (Send icono) y acción `Limpiar conversación` que llama al endpoint clear y vacía el historial visual. Errores vía toast existente. En mobile el panel ocupa casi todo el ancho disponible. Historial solo en memoria del componente.

## Risks / Trade-offs

- [Latencia local] Inferencia CPU con llama3.1:8b tarda más que con modelos de 3B (varios segundos por mensaje); aceptado por el usuario a cambio de mejor razonamiento numérico, señalado en UI con indicador de espera.
- [Índice en memoria] Se reconstruye por proceso y ante cambios de datos; para volúmenes personales es inmediato.
- [Modelos no descargados] Si `ollama-init` no corrió, los endpoints fallan con mensaje de error visible; el E2E valida el pull.

## Migration Plan

Sin cambios en backend Node ni esquema. Rollback = revertir commit (compose vuelve al esqueleto).

## Open Questions

Ninguna.
