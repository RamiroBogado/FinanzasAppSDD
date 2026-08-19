## Why

FinanzasApp comienza desde cero y necesita una base técnica ejecutable y verificable sobre la cual construir las futuras capacidades de negocio (autenticación, ingresos, gastos, categorías, presupuestos, metas, dashboard, exportaciones y chatbot). Sin este bootstrap, cada capa del monorepo no tendría estructura, tooling ni criterios de verificación consistentes.

## What Changes

- Crear la estructura base del monorepo con las capas `backend/`, `frontend/` y `ai/`.
- **Backend** (`backend/`): Node.js + Express, SQLite con better-sqlite3, health check mínimo para validar el bootstrap, preparación de ESLint y Vitest, puerto 3001 y estructura inicial para la futura API REST organizada por recurso. Sin registro, login, usuarios, funcionalidades financieras ni schema de negocio.
- **Frontend** (`frontend/`): React 18 + Vite + Tailwind CSS + React Router, ESLint, proxy de Vite (`/api` → backend:3001, `/ai` → ai:3002) y una página inicial mínima con el mensaje en español `FinanzasApp está funcionando` para validar visualmente el bootstrap. Sin login, dashboard ni funcionalidades financieras.
- **AI** (`ai/`): FastAPI en puerto 3002, LangChain, health check mínimo, preparación únicamente de la configuración de integración con Ollama (host y modelos llama3.2 y nomic-embed-text definidos, sin descargarlos ni invocarlos), pytest y estructura inicial para el chatbot RAG con la abstracción `VectorStoreProvider`. Sin chatbot funcional todavía.
- **Docker**: docker-compose con dependencias declaradas entre servicios, de modo que `docker compose up -d --build app` ponga también disponibles backend, ai y ollama, respetando los puertos definidos (backend 3001, ai 3002, ollama 11434) y el volumen `finanzas_data` que persiste `/app/data/finanzas.db`.
- Establecer criterios de verificación por capa: `npm run lint` y `npm test` en backend, `npm run lint` y `npm run build` en frontend, y `.\.venv\Scripts\python.exe -m pytest -q` en ai.
- No implementar funcionalidades de negocio en este change.

## Capabilities

### New Capabilities
- `bootstrap`: Base técnica del monorepo: estructura de las capas, health checks mínimos, puertos, proxy, contenedores Docker con dependencias declaradas, persistencia de la base en `/app/data/finanzas.db` y comandos de verificación por capa. Los requisitos describen el comportamiento infraestructural verificable sobre el que se construirán las capacidades de negocio.

### Modified Capabilities
- Ninguna: no existen specs previas en el repositorio.

## Impact

- **Code**: creación de `backend/`, `frontend/` y `ai/` con su estructura inicial; no se modifica código existente (proyecto verde).
- **APIs**: expone health checks mínimos para backend e IA con el fin de validar el bootstrap; no expone endpoints de negocio.
- **Dependencies**: Express, better-sqlite3, Vitest, ESLint (backend); React 18, Vite, Tailwind CSS, React Router, ESLint (frontend); FastAPI, LangChain, uvicorn, pytest (ai); ollama (infra). No se agregan dependencias sin uso en este change.
- **Systems**: SQLite (`/app/data/finanzas.db`), Ollama, Docker Compose con volúmenes.
- **Config**: nuevas configuraciones de tooling por capa (`eslint.config.js`, `vite.config.js`, `requirements.txt`, `docker-compose.yml`). `openspec/config.yaml` permanece sin cambios y se trata como fuente de contexto.