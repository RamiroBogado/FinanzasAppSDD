# Design: ai-hybrid-deploy

## Technical Approach

Hybrid topology: web + API on one host (Vercel), AI service (FastAPI + Ollama + ChromaDB) on an external host with persistent volume. Turso is the sole production data source; local SQLite stays for local dev and rollback. The existing proxy in `backend/src/routes/chat.js` (`POST /api/chat/messages` → `${AI_SERVICE_URL}/ai/chatbot/message` with `Authorization` forwarded) is kept as-is and hardened with a configurable timeout. AI reads Turso read-only via a new data-access branch in `ai/app/data.py` keeping the same 4 `user_id`-filtered queries. No contract changes: frontend keeps calling only `/api/*`, `VectorStoreProvider` and JWT validation stay untouched.

**Route reconciliation**: proposal.md names `/api/ai/chatbot/*`, but the code (`backend/src/app.js`, `chat.js`) and the spec use `POST /api/chat/messages`. The design adopts the existing route; no new backend route is created.

## Architecture Decisions

### Decision: AI host

**Choice**: Fly.io with a persistent volume for Chroma + model cache.
**Alternatives considered**: Render (ephemeral disk without paid volume, cold starts kill the index), Railway (volume support weaker, cost less predictable), plain VPS (full control but manual TLS/ops burden).
**Rationale**: Fly.io gives volumes, keeps the Docker image unchanged, and cold-start behavior is documentable; matches existing `docker-compose.yml` service layout.

### Decision: Python Turso client

**Choice**: `libsql-experimental` (DBAPI sync client) behind a `TURSO_*` branch in `ai/app/data.py`, defaulting to SQLite when vars are absent.
**Alternatives considered**: `sqlalchemy-libsql` (adds an ORM layer for 4 raw queries — unjustified), raw Hrana HTTPS (hand-rolled protocol handling, more code to maintain).
**Rationale**: Smallest dependency that preserves the current `sqlite3` query style and `mode=ro` parity; no new technology beyond the driver.

### Decision: Secrets

**Choice**: Shared `JWT_SECRET` on both hosts; AI gets a Turso read-only token (`TURSO_AUTH_TOKEN`) never shipped to frontend or backend.
**Alternatives considered**: Separate JWT issuers per host (breaks the shared-auth contract), read-write Turso token for AI (violates read-only requirement).
**Rationale**: Preserves the existing shared-JWT contract (`backend/src/config.js`, `ai/app/config.py`, `ai/app/auth.py`); least-privilege Turso token enforces read-only at the credential level.

### Decision: Backend proxy hardening

**Choice**: Keep `AI_SERVICE_URL` (already in `backend/src/config.js`); add `AI_TIMEOUT_MS` (default ~25s, below Vercel limits) enforced with `AbortSignal.timeout`; timeout/invalid reply → existing 502 `El asistente no está disponible en este momento`.
**Alternatives considered**: New `/api/ai/chatbot/*` routes (contradicts code + spec, churns frontend `src/api.js`), streaming SSE (new contract, out of scope).
**Rationale**: Follows the existing pattern; no frontend or AI contract change.

### Decision: Chroma and models on the AI host

**Choice**: Persistent volume mounted at `CHROMA_PATH`; Ollama models (`llama3.1:8b`, `nomic-embed-text`) pre-pulled at deploy (same as `ollama-init`); document cold-start latency.
**Alternatives considered**: Ephemeral disk (index loss on every restart), lazy model pull (first request pays minutes).
**Rationale**: `VectorStoreProvider` per-user namespaces (`user-{id}`, shared `finanzas-knowledge`) assume persistence; pre-pull bounds cold start.

### Decision: Docs and tests

**Choice**: Document `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AI_SERVICE_URL`, `AI_TIMEOUT_MS`, `DB_PATH` fallback in `.env.example` + `README`; AI tests against a Turso test db asserting identical results to SQLite fixtures plus a write-rejection test.
**Alternatives considered**: Docs-only without parity tests (regression risk on the query port).
**Rationale**: Verification-per-layer rule; parity tests prove the query port preserves `WHERE user_id` isolation.

## Data Flow

```
ChatWidget.jsx ──POST /api/chat/messages──→ backend/routes/chat.js
      (frontend/src/api.js, only /api/*)       │ requireAuth → userId
                                               │ fetch AI_SERVICE_URL/ai/chatbot/message
                                               │ + Authorization, AbortSignal.timeout
                                               ▼
                                    ai/main.py → require_user_id (same JWT_SECRET)
                                               → data.py (Turso RO, WHERE user_id = ?)
                                               → indexer.retrieve_combined (VectorStoreProvider)
                                               → build_reply → { reply, action }
```

JWT (`Authorization: Bearer`) flows end-to-end unmodified; backend never inspects AI internals, AI never trusts a user id from the body.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/config.js` | Modify | Add `aiTimeoutMs` from `AI_TIMEOUT_MS` |
| `backend/src/routes/chat.js` | Modify | Timeout via `AbortSignal`, keep route/target/502 contract |
| `backend/test/chat.test.js` | Modify | Proxy timeout + 502 + auth-forward cases |
| `ai/app/data.py` | Modify | Turso RO branch (`TURSO_*`), same 4 queries, fallback SQLite |
| `ai/app/config.py` | Modify | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, startup check |
| `ai/requirements.txt` | Modify | Add `libsql-experimental` pinned |
| `ai/tests/test_data_turso.py` | Create | Parity vs SQLite fixtures + write-rejection + isolation |
| `docker-compose.yml` | Modify | `TURSO_*` vars for ai service |
| `.env.example` | Modify | Document `TURSO_*`, `AI_SERVICE_URL`, `AI_TIMEOUT_MS` |
| `README.md` | Modify | Hybrid deploy, cold start, rollback procedure |

No SQLite schema change (no `CREATE TABLE`/`PRAGMA` work).

## Interfaces / Contracts

- Unchanged: `POST /api/chat/messages` ↔ frontend; `POST /ai/chatbot/message`, `POST /ai/chatbot/clear` ↔ backend; `VectorStoreProvider.query/add` untouched.
- New env: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (AI only, read-only), `AI_TIMEOUT_MS` (backend, default ~25000). `DB_PATH` remains local fallback.
- AI startup MUST fail fast if `JWT_SECRET` missing; MUST warn if Turso vars absent in production (SQLite fallback is local-only).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Backend unit/integration | Proxy forwards `Authorization`, timeout → 502, invalid AI reply → 502 | Extend `backend/test/chat.test.js` with mocked AI endpoint |
| AI unit/integration | Turso query parity (transactions/budgets/goals/fingerprint), `user_id` isolation, write rejected | `ai/tests/test_data_turso.py` vs SQLite fixtures |
| E2E | Smoke register → login → transactions → chatbot answer | Staging with Turso creds + `AI_SERVICE_URL` pointing at AI host |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The proxy target comes from server env (`AI_SERVICE_URL`), never from user input; no SSRF surface beyond existing config.

## Migration / Rollout

No migration. Rollout: deploy AI host with volume + models pre-pulled → set backend `AI_SERVICE_URL` to AI host → verify smoke + isolation → cut over. Rollback: point `AI_SERVICE_URL` back at local AI with `DB_PATH` SQLite RO; contract unchanged so rollback is config-only.

## Open Questions

- [ ] Confirm Fly.io region/volume size vs Chroma + Ollama cache (~5GB+ models)?
- [ ] p95 CPU latency budget for `AI_TIMEOUT_MS` default — measure on staging first?

## Risks / Trade-offs

- [Token Turso con escritura en servicio solo-lectura] → Mitigación: token de lectura dedicado; test de escritura rechazada.
- [Regresión de aislamiento (`WHERE user_id`)] → Mitigación: port 1:1 de las 4 queries; tests de paridad + aislamiento.
- [Skew JWT/secretos entre hosts] → Mitigación: mismo secreto; check de arranque que falla rápido.
- [Chroma sin volumen pierde índice] → Mitigación: volumen obligatorio montado en `CHROMA_PATH`.
- [Latencia CPU + timeout Vercel] → Mitigación: `AI_TIMEOUT_MS` configurable; medir p95 en staging.
