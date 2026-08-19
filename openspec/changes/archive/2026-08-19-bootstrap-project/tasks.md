## 1. Backend

- [x] 1.1 Crear `backend/` con `package.json` y dependencias `express`, `better-sqlite3`, Vitest y ESLint, además de los scripts `dev`, `lint` y `test`
- [x] 1.2 Crear la estructura inicial `backend/src/` con `app.js`, `server.js`, `db.js` y la carpeta `routes/`, de modo que el servidor inicie en el puerto 3001 sin exponer rutas de negocio
- [x] 1.3 Implementar `backend/src/db.js` para abrir SQLite con better-sqlite3: utilizar `:memory:` en el entorno de test y un archivo persistente en el entorno normal, asegurando el directorio `/app/data` cuando corresponda
- [x] 1.4 Implementar `GET /health` en el backend como health check mínimo, sin lógica de negocio
- [x] 1.5 Configurar ESLint en `backend/` con `eslint.config.js`
- [x] 1.6 Configurar Vitest y un test mínimo que valide la inicialización de la aplicación, configurando SQLite `:memory:` antes de importar el módulo de base de datos
- [x] 1.7 Ejecutar `npm run lint` y `npm test` en `backend/` y marcar la tarea completa solamente si ambas verificaciones finalizan sin errores

## 2. Frontend

- [x] 2.1 Crear `frontend/` mediante Vite con React 18 y JavaScript, utilizando versiones compatibles de Vite, Tailwind CSS y React Router sin introducir versiones mayores arbitrarias
- [x] 2.2 Configurar Tailwind CSS en `frontend/` mediante la configuración correspondiente y las directivas necesarias en `src/index.css`
- [x] 2.3 Configurar React Router en `frontend/` con una ruta inicial mínima, sin login, dashboard ni funcionalidades financieras
- [x] 2.4 Crear una página inicial mínima con textos visibles en español que indique que FinanzasApp está funcionando, sin implementar funcionalidades de negocio
- [x] 2.5 Configurar el proxy de Vite en `vite.config.js`: `/api` hacia el backend y `/ai` hacia el servicio de IA, sin anteponer `/api` a las rutas `/ai`, utilizando objetivos configurables para desarrollo local y Docker
- [x] 2.6 Configurar ESLint en `frontend/`
- [x] 2.7 Ejecutar `npm run lint` y `npm run build` en `frontend/` y marcar la tarea completa solamente si ambas verificaciones finalizan sin errores. El warning preexistente de chunks mayores a 500 kB no debe considerarse error

## 3. AI

- [x] 3.1 Crear `ai/` con `requirements.txt` para FastAPI, uvicorn y LangChain, y `requirements-dev.txt` para pytest
- [x] 3.2 Crear la aplicación FastAPI base en `ai/app/main.py` que inicie en el puerto 3002
- [x] 3.3 Crear `ai/app/config.py` con la configuración del host de Ollama y los modelos previstos `llama3.2` y `nomic-embed-text`, sin descargar ni invocar los modelos
- [x] 3.4 Implementar `GET /health` en AI como health check mínimo, sin lógica de chatbot
- [x] 3.5 Crear en `ai/app/` la abstracción `VectorStoreProvider` con una implementación mínima `InMemoryVectorStore` testeable, sin RAG, embeddings reales ni endpoints de chatbot
- [x] 3.6 Crear tests con pytest para validar la inicialización del servicio, el health check y la abstracción de almacenamiento vectorial
- [x] 3.7 Ejecutar `.\.venv\Scripts\python.exe -m pytest -q` en `ai/` y marcar la tarea completa solamente si finaliza sin errores

## 4. Docker

- [x] 4.1 Crear `backend/Dockerfile` para ejecutar el backend sobre Node 22 Alpine en el puerto 3001
- [x] 4.2 Crear `ai/Dockerfile` para ejecutar el servicio de IA sobre Python 3.12 slim en el puerto 3002
- [x] 4.3 Crear el `Dockerfile` del servicio `app` para servir el frontend mediante Vite con host `0.0.0.0`
- [x] 4.4 Crear `docker-compose.yml` con los servicios `backend`, `ai`, `ollama` y `app`, respetando los puertos 3001, 3002, 11434 y 5173 respectivamente
- [x] 4.5 Configurar las dependencias entre servicios para que `docker compose up -d --build app` también inicie backend, ai y ollama, teniendo en cuenta que `depends_on` controla el orden pero no garantiza readiness
- [x] 4.6 Configurar el volumen `finanzas_data` para persistir `/app/data/finanzas.db` utilizado por el backend
- [x] 4.7 Ejecutar `docker compose up -d --build app`, comprobar que los servicios necesarios están levantados y verificar los health checks de backend y AI
- [x] 4.8 Verificar que la base `finanzas.db` se mantiene en el volumen `finanzas_data` después de reiniciar el contenedor correspondiente