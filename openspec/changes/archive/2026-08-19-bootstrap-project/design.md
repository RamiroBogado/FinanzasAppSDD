## Context

Monorepo en estado inicial: no existe código de aplicación; el repositorio git y el `.gitignore` raíz ya están inicializados. `openspec/config.yaml` ya está configurado y se trata como fuente de contexto y puertos (backend 3001, IA 3002, Ollama 11434), por lo que este change NO lo modifica. La motivación y el alcance están en `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Tres capas independientes (`backend/`, `frontend/`, `ai/`) con tooling propio y verificable.
- Health checks mínimos en backend e IA que validen el arranque del bootstrap.
- Un arranque unificado y reproducible con Docker Compose (`docker compose up -d --build app`) que deje disponibles también backend, ai y ollama.
- Persistencia de la base SQLite en `/app/data/finanzas.db` vía volumen `finanzas_data`.
- Futura capacidad de chatbot RAG soportada por la abstracción `VectorStoreProvider` dejada lista.

**Non-Goals:**
- Implementar autenticación, registro, login o recuperación de contraseña; no se instalan bibliotecas de autenticación sin uso.
- Implementar entidades o funcionalidades financieras (ingresos, gastos, categorías, presupuestos, metas, dashboard, exportaciones) ni schema de negocio.
- Implementar el chatbot RAG funcional, RAG real ni embeddings, ni la integración en ejecución con Ollama.
- Descargar ni instalar modelos de Ollama durante el bootstrap.
- Resolver el modo de producción estático del frontend (nginx): se sirve mediante el servidor de desarrollo de Vite durante el bootstrap.
- Modificar `openspec/config.yaml` ni el repositorio git (ya inicializado).

## Decisions

### D1. Monorepo sin workspace manager en el bootstrap
Tres carpetas hermanas (`backend/`, `frontend/`, `ai/`), cada una con su propio `package.json` (o gestión de dependencias Python) y sin dependencia cruzada de tooling.
- **Alternativas consideradas**: npm workspaces monorepo único; Yarn/Pnpm workspaces; Turborepo.
- **Razón**: las tres capas son despliegues independientes, una es Python y no se beneficia de workspaces de npm; un workspace global agrega fricción sin aportar al bootstrap. Los cambios futuros pueden introducir un orquestador si lo justifican.

### D2. Backend Node.js: Express + better-sqlite3, sin framework pesado
`backend/` con Express como servidor HTTP, `better-sqlite3` para SQLite, y un módulo de base de datos que abre `:memory:` en el entorno de test y el archivo de producción en caso contrario.
- **Alternativas**: Fastify (cercano en rendimiento, pero el contexto fija Express); Prisma/TypeORM (rechazados: el contexto prohíbe migraciones externas).
- **Razón**: Express es la elección definida en el contexto y better-sqlite3 es síncrono, simple y suficiente para una base local única.
- NO se instalan `jsonwebtoken` ni `bcryptjs`: no tienen uso en este change. El change de autenticación futuro los incorporará con su justificación.
- Health check mínimo `GET /health` que responde éxito sin lógica de negocio, para validar el arranque del contenedor.
- `db.js` solo asegura el directorio/archivo y NO crea tablas de negocio: `finanzas.db` queda sin schema en el bootstrap (el schema lo define un change futuro).
- Estructura mínima: `src/server.js` (arranque + puerto), `src/app.js` (configuración Express, `express.json()`), `src/db.js` (apertura de SQLite), carpeta `routes/` reservada. Sin modelos ni controladores de negocio.

### D3. Frontend: Vite + React 18 + versiones compatibles
Scaffold de Vite (plantilla React + JavaScript, sin TypeScript porque el contexto no lo exige y no se justifica introducirlo).
- **Alternativas consideradas**: Next.js (rechazado: el contexto define SPA con Vite y proxy).
- **Razón**: React 18 está fijado por el contexto; el resto de las dependencias (Vite, Tailwind CSS, PostCSS, Autoprefixer, React Router) se instalan en sus versiones estables disponibles que sean compatibles con React 18, sin fijar versiones mayores arbitrarias. Al concluir el scaffold, las versiones efectivamente instaladas quedan registradas en `frontend/package.json` y documentadas.
- Página inicial mínima en la ruta raíz con el mensaje en español `FinanzasApp está funcionando`, sin login, dashboard ni funcionalidades de negocio, para validar visualmente el arranque del bootstrap.
- Proxy de Vite en `vite.config.js`: `/api` → `http://backend:3001` y `/ai` → `http://ai:3002` (nombres de servicio de la red de Docker Compose), sobreescribible por variables de entorno para desarrollo local (`localhost`). Las rutas `/ai` no llevan prefijo `/api`.

### D4. AI: FastAPI + LangChain + configuración de Ollama preparada
`ai/` con aplicación FastAPI (`app/main.py`), uvicorn en puerto 3002 y `langchain` instalado. El módulo de configuración (`app/config.py`) define el host de Ollama (`http://localhost:11434`, en Docker `http://ollama:11434`) y los nombres de modelo (`llama3.2`, `nomic-embed-text`) como constantes, únicamente como configuración.
- **Alternativas**: Express/Node para la IA (rechazado: el contexto fija FastAPI + LangChain); almacenamiento directo en ChromaDB (rechazado: el contexto exige la abstracción `VectorStoreProvider`).
- El bootstrap NO ejecuta `ollama pull` ni llama a la API de Ollama: los modelos no se descargan ni se invocan; los paquetes de integración con Ollama y los embeddings reales se agregan en el change del chatbot.
- `VectorStoreProvider` se define como abstracción con la implementación mínima testeable `InMemoryVectorStore` (sin RAG ni embeddings reales) y sin endpoints de chatbot funcionales.
- Health check mínimo `GET /health` que responde éxito sin lógica de negocio, para validar el arranque del contenedor.
- Dependencias mínimas: `requirements.txt` (fastapi, uvicorn, langchain) y `requirements-dev.txt` (pytest); la verificación se ejecuta con el intérprete del `.venv` local.

### D5. Docker Compose: un servicio `app` que sirve el frontend de Vite con dependencias entre servicios
Compose con cuatro servicios: `backend` (3001), `ai` (3002), `ollama` (11434) y `app` (frontend, puerto 5173). `app` ejecuta el servidor de desarrollo de Vite (host `0.0.0.0`) y, dado que Vite dev aplica `server.proxy`, las rutas `/api` y `/ai` se reenvían a los hosts de la red Compose.
- **Alternativas**: nginx como `app` sirviendo `dist/` y haciendo el proxy en producción.
- **Razón**: evita duplicar el proxy (Vite y nginx) durante el bootstrap y valida exactamente la configuración de proxy que exige el spec. El modo nginx/productivo queda fuera de alcance para un change futuro.
- Dependencias declaradas: `app` → `depends_on` `backend` y `ai`; `ai` → `depends_on` `ollama` (condición de servicio iniciado). Así, `docker compose up -d --build app` también deja disponibles backend, ai y ollama. `depends_on` garantiza orden de inicio, no readiness: los health checks mínimos permiten validar la disponibilidad real de backend e IA.
- `backend` monta el volumen `finanzas_data` en `/app/data` y garantiza la ruta antes de abrir `finanzas.db`. Imágenes base: `node:22-alpine` y `python:3.12-slim`.

## Risks / Trade-offs

- [Servir el frontend con `vite dev` en producción no es óptimo] → El bootstrap lo declara en Non-Goals; un change futuro agregará build + nginx estático con su propio proxy.
- [Proxy de Vite apuntando a `backend`/`ai` requiere nombres de servicio válidos en la red Docker] → En desarrollo local se sobreescribe mediante variables de entorno hacia `localhost`; se documenta en la capa.
- [`depends_on` garantiza el orden de inicio, no la disponibilidad] → Los health checks mínimos de backend e IA permiten validar que los servicios responden tras el arranque.
- [Las versiones instaladas de Vite, Tailwind CSS y React Router deben ser compatibles con React 18] → Se instalan versiones compatibles y se registran las versiones efectivamente instaladas en `frontend/package.json`.
- [La base se crea sin schema: `finanzas.db` quedará sin tablas] → Es intencional para validar el bootstrap; el schema lo define el change de auth/datos futuros.

## Migration Plan

Proyecto verde: no hay despliegue previo ni datos que migrar. Despliegue inicial: `docker compose up -d --build app` más los comandos de verificación por capa. Rollback: `docker compose down` y, si se desea partir de cero, `docker volume rm finanzas_data`.

## Open Questions

- Versiones exactas de Vite, Tailwind CSS y React Router compatibles con React 18 (se resuelven al instalar y quedan documentadas en `frontend/package.json`).
- Host por defecto del proxy para desarrollo local (`localhost`) vs servicio Docker (`backend`/`ai`): se resuelve con variables de entorno en la implementación.