# Proposal: ai-hybrid-deploy

## Why

Vercel solo puede alojar web+api; la AI (FastAPI + Ollama + ChromaDB, modelos ~5GB, volumen persistente) necesita host externo. El backend prod ya lee 100% de Turso, pero la AI sigue leyendo SQLite local RO (`ai/app/data.py`, 4 queries por `user_id`): en producción el chatbot quedaría sin datos. Se necesita topología híbrida con flujo `frontend → backend → AI` sin CORS.

## What Changes

- AI lee Turso en solo-lectura con paridad a `mode=ro`; librería por decidir (`libsql-experimental` / `sqlalchemy-libsql` / Hrana HTTPS); mismas 4 queries por `user_id`.
- Backend reenvía `/api/ai/chatbot/*` a `${AI_SERVICE_URL}/ai/chatbot/message` propagando `Authorization`; `AI_SERVICE_URL` y timeout configurables.
- Host AI por decidir (Fly.io / Render / Railway / VPS) con volumen Chroma, caché de modelos y plan de arranque frío; JWT compartido; secreto Turso de solo-lectura.
- Docs (`.env.example`, `README`, `compose` con `TURSO_*`) y tests AI contra Turso con verificación por capa.
- Fuera de alcance: modelos, GPU, migraciones Turso, refactors.

## Capabilities

### New Capabilities

- `ai-hybrid-deploy`: topología híbrida, proxy backend→AI, configuración, docs y verificación del despliegue.

### Modified Capabilities

- `chatbot`: la fuente de lectura pasa de SQLite RO a Turso en solo-lectura, manteniendo aislamiento por `user_id` y endpoints sin cambios.

## Impact

- **backend** (Modificado): proxy chatbot, `AI_SERVICE_URL`, timeout; sin cambio de schema.
- **ai** (Modificado): `ai/app/data.py`, `requirements.txt`, config; sin cambio de schema SQLite.
- **frontend** (Sin cambios funcionales): sigue llamando solo `/api/*`, sin CORS nuevo.
- **infra/docs** (Modificado): `docker-compose.yml`, `.env.example`, `README`.
- **Schema SQLite**: sin cambios (`goal_id` ya existe; sin `ALTER`).

## Enfoque

Opción A híbrida aprobada: Vercel con web+api; AI en host con volumen; Turso como única fuente prod. `design` decide host, librería y secretos.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Token Turso con escritura en servicio solo-lectura | Med | Token de lectura |
| Regresión de aislamiento (`WHERE user_id`) | Med | Auditar queries + tests |
| Skew JWT/secretos entre hosts | Med | Mismo secreto; check de arranque |
| Chroma sin volumen pierde índice | Med | Volumen obligatorio |
| Latencia CPU + timeout Vercel | High | Timeout configurable; medir p95 |

## Rollback Plan

Revertir `AI_SERVICE_URL` al AI local con `DB_PATH` SQLite RO. Sin migraciones.

## Dependencias

- Turso prod con token de lectura; host AI con volumen; `JWT_SECRET` compartido.

## Criterios de éxito

- [ ] Chatbot en prod responde con datos de Turso del usuario.
- [ ] Aislamiento verificado: ningún usuario ve datos de otro.
- [ ] Frontend solo llama `/api/*`; backend propaga `Authorization` a la AI.
- [ ] Docs (`TURSO_*`, `AI_SERVICE_URL`) actualizados y verificación verde por capa modificada.
