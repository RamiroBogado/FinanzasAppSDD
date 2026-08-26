\# FinanzasApp



\## Project



FinanzasApp es una aplicación de finanzas personales multiusuario.



El proyecto se desarrolla como un monorepo con tres capas:



\- `backend/`: API REST

\- `frontend/`: aplicación web

\- `ai/`: servicio de inteligencia artificial



\## Development Rules



\- Seguir `openspec/config.yaml` como fuente de reglas para el workflow spec-driven.

\- Los cambios de funcionalidades deben estar respaldados por un change activo de OpenSpec.

\- No implementar funcionalidades fuera del alcance del change activo.

\- No introducir tecnologías o dependencias sin justificar la decisión.

\- No realizar refactors no relacionados con el change activo.

\- Antes de implementar, inspeccionar el código y las specs existentes.

\- Mantener aislados los datos de cada usuario.

\- No exponer datos financieros de un usuario a otro usuario.

\- El servicio de IA debe respetar el mismo aislamiento de datos y autorización que el backend.

\- Ejecutar la verificación correspondiente a cada capa modificada antes de considerar terminado un change.

\- Los identificadores de código y commits deben estar en inglés.

\- Los textos visibles de la aplicación deben estar en español.

\- Los mensajes de error deben estar en español.

\- No agregar comentarios explicativos al código salvo que sean estrictamente necesarios.

\- Todas las operaciones de Git/GitHub (commits, push, pull, merge, branch, PRs, issues) y el tablero de GitHub Projects deben delegarse al agente `git`; ningún otro agente debe ejecutar `git`, `gh` ni las herramientas MCP `github_*` directamente.

\- El tablero del proyecto (GitHub Projects `@Board FinanzasAppSDD`, proyecto #3) debe reflejar el estado real de los changes de OpenSpec: `Todo`, `In Progress`, `Test`, `Done`. El proyecto `FinanzasApp - Kanban` (#2) corresponde a otro repo y no se toca.

---

## Anchored Section (self-updating)

### Architecture
- Monorepo: `backend/` (Node/Express5/SQLite ESM), `frontend/` (React/Vite/Tailwind), `ai/` (FastAPI/LangChain/Ollama)
- Docker Compose orquesta servicios; Frontend sirve app web
- Language: Spanish for product/conversation; commits in English; issues WITHOUT labels
- `git`/`gh` PROHIBIDOS directly; delegate to `task` with `subagent_type=git`
- PRs merge with MERGE COMMIT (NO squash)
- Project GitHub #3 "@Board FinanzasAppSDD"; NEVER touch project #2 "FinanzasApp - Kanban"
- Smoke E2E learnings: registration requires email and does NOT return token; `/api/auth/me` returns `{id}` directly; PowerShell requires temp file; backend is ESM → use `--input-type=module`; ChromaDB collections: `finanzas-user-{userId}` and `finanzas-knowledge` (shared)

### Completed Changes
- `ai-vector-store` — commit `89425f0`, PR [#17](https://github.com/RamiroBogado/FinanzasAppSDD/pull/17), issue #16 closed, archivado en `openspec/changes/archive/2026-08-24-ai-vector-store/`, Done
- `chat-history` — commit `d4c9d44`, PR [#19](https://github.com/RamiroBogado/FinanzasAppSDD/pull/19) merged as `784b16f`, issue #18 closed, archivado en `openspec/changes/archive/2026-08-25-chat-history/`, Done
- `ai-financial-advice` — commit `9287899`, PR [#21](https://github.com/RamiroBogado/FinanzasAppSDD/pull/21) merged as `43158ec`, issue #20 closed, archivado en `openspec/changes/archive/2026-08-25-ai-financial-advice/`, Done

### Fix Applied
- `chatbot-data-freshness` — commit `dac6edc`, consolidated overview document + retrieval limit tuning + race condition fix (not an OpenSpec change; bugfix)

### Working Tree State
- HEAD: `dac6edc` (fix: improve chatbot data freshness)
- master and origin/master synchronized at `dac6edc`
- Pending commits: opencode.json + stitch skills (config/tooling, not app code)

### Active Changes
- (none)

### Testing Protocols
- Backend: `npm test` in `backend/` → 134/134 passing
- AI: `.\.venv\Scripts\python.exe -m pytest -q` in `ai/` → 61/61 passing
- Frontend: `npm run lint && npm run build` in `frontend/`
- Smoke E2E: register → login → create transactions → chatbot question → verify answer

### Decision History
- Docker Compose orchestrates all services
- Use `sql.js` for backend tests, `uvicorn` for AI server
- Backend is ESM; use `--input-type=module` for pipe
- Knowledge base: `finanzas-knowledge` collection shared across users (read-only ChromaDB)
- System prompt must NOT include synthetic examples; only parse retrieved documents
- Chatbot retrieval: `RETRIEVAL_LIMIT=12`, `KNOWLEDGE_LIMIT=2` → 10 user docs + 2 knowledge docs
- Consolidated overview document at position 0 ensures balance/summary always available to LLM
- `store.query()` inside lock prevents race condition during rebuild

### Next Move
- (Awaiting next user request; backlog clean)

