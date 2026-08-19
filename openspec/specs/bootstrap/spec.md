# bootstrap Specification

## Purpose

Define la base técnica ejecutable y verificable del monorepo sobre la cual se construirán las futuras capacidades de negocio: estructura de capas, servicios base, tooling de calidad y arranque mediante Docker Compose.

## Requirements

### Requirement: Monorepo con tres capas separadas
El repositorio DEBE contener tres capas independientes y desarrollables por separado: `backend/`, `frontend/` y `ai/`. Cada capa DEBE tener su propia configuración de tooling, dependencias y comandos de verificación, sin depender de las configuraciones o tooling de otra capa.

#### Scenario: Cada capa tiene tooling propio
- **WHEN** se inspecciona la raíz del repositorio
- **THEN** existen las carpetas `backend/`, `frontend/` y `ai/` y cada una contiene su propia configuración de tooling y dependencias

#### Scenario: Verificación aislada por capa
- **WHEN** se ejecutan los comandos de verificación de una capa
- **THEN** estos utilizan únicamente el tooling de esa capa y no dependen de que otra capa esté instalada o en ejecución

### Requirement: Backend base en el puerto 3001
El backend DEBE ofrecer un servidor Express base que se inicie sin errores escuchando en el puerto 3001 y deje preparada la configuración de SQLite mediante better-sqlite3. El backend NO DEBE exponer endpoints de negocio ni crear schema de negocio.

#### Scenario: El backend se inicia en el puerto 3001
- **WHEN** se inicia el servidor del backend
- **THEN** el servidor queda escuchando en el puerto 3001 sin errores

#### Scenario: El backend no expone funcionalidades de negocio
- **WHEN** se revisan las rutas registradas en el backend
- **THEN** no existen rutas de autenticación, transacciones, categorías, presupuestos ni metas

#### Scenario: La base de datos no contiene schema de negocio
- **WHEN** se inicializa la base SQLite durante el bootstrap
- **THEN** no existen tablas de usuarios, ingresos, gastos, categorías, presupuestos ni metas

### Requirement: Backend verificable con lint y tests
El backend DEBE permitir ejecutar `npm run lint` y `npm test` de forma exitosa. Los tests DEBEN estar preparados con Vitest y el entorno de base de datos en memoria (SQLite `:memory:`) cuando corresponda.

#### Scenario: El lint del backend pasa
- **WHEN** se ejecuta `npm run lint` en `backend/`
- **THEN** el comando finaliza sin errores de estilo ni de lint

#### Scenario: Los tests del backend pasan
- **WHEN** se ejecuta `npm test` en `backend/`
- **THEN** los tests preparados para el bootstrap se ejecutan y finalizan en verde

### Requirement: Health checks mínimos de backend e IA
El backend Y el servicio de IA DEBEN exponer cada uno un health check mínimo que responda exitosamente al ser consultado, con el fin de validar el arranque del bootstrap. Los health checks NO DEBEN depender de funcionalidades de negocio.

#### Scenario: El health check del backend responde
- **WHEN** se consulta el health check del backend
- **THEN** el backend responde indicando que el servicio está en ejecución

#### Scenario: El health check del servicio de IA responde
- **WHEN** se consulta el health check del servicio de IA
- **THEN** el servicio de IA responde indicando que está en ejecución

### Requirement: Frontend base con React y Vite
El frontend DEBE ser una aplicación base con React 18 + Vite, Tailwind CSS y React Router que permita ejecutar `npm run lint` y `npm run build` de forma exitosa. El frontend NO DEBE contener login, dashboard ni funcionalidades financieras.

#### Scenario: El lint del frontend pasa
- **WHEN** se ejecuta `npm run lint` en `frontend/`
- **THEN** el comando finaliza sin errores de estilos ni de lint

#### Scenario: El build del frontend se genera correctamente
- **WHEN** se ejecuta `npm run build` en `frontend/`
- **THEN** se genera el bundle de producción sin errores

#### Scenario: El frontend no muestra funcionalidades de negocio
- **WHEN** se navega por la aplicación base
- **THEN** no se presentan login, dashboard ni funcionalidades financieras

#### Scenario: La página inicial confirma que la aplicación funciona
- **WHEN** se abre la aplicación base
- **THEN** se muestra la página inicial con el mensaje en español `FinanzasApp está funcionando`, sin login, dashboard ni funcionalidades de negocio

### Requirement: Proxy de Vite hacia backend e IA
El frontend DEBE enrutar las solicitudes que comienzan con `/api` hacia el backend en el puerto 3001 y las que comienzan con `/ai` hacia el servicio de IA en el puerto 3002. Las rutas `/ai` NO DEBEN anteponerse `/api`.

#### Scenario: Las solicitudes /api llegan al backend
- **WHEN** el frontend envía una solicitud a una ruta que comienza con `/api`
- **THEN** la solicitud es reenviada al backend en el puerto 3001

#### Scenario: Las solicitudes /ai llegan al servicio de IA
- **WHEN** el frontend envía una solicitud a una ruta que comienza con `/ai`
- **THEN** la solicitud es reenviada al servicio de IA en el puerto 3002 sin anteponer `/api`

### Requirement: Servicio de IA base en el puerto 3002
El servicio de IA DEBE ser una aplicación FastAPI base que se inicie sin errores escuchando en el puerto 3002, con LangChain instalado, la configuración de integración con Ollama preparada (host y modelos `llama3.2` y `nomic-embed-text`) sin descargar ni invocar modelos, tests preparados con pytest y una estructura que deje prevista la abstracción de almacenamiento vectorial para el futuro chatbot RAG. El servicio NO DEBE ofrecer un chatbot funcional ni RAG ni embeddings reales.

#### Scenario: El servicio de IA se inicia en el puerto 3002
- **WHEN** se inicia el servidor de IA con uvicorn
- **THEN** el servidor queda escuchando en el puerto 3002 sin errores

#### Scenario: Los tests de IA pasan
- **WHEN** se ejecuta `.\.venv\Scripts\python.exe -m pytest -q` en `ai/`
- **THEN** los tests preparados para el bootstrap se ejecutan y finalizan en verde

#### Scenario: El chatbot no es funcional todavía
- **WHEN** se revisan los endpoints expuestos por el servicio de IA
- **THEN** no existe un endpoint de chatbot funcional que responda mensajes del usuario

#### Scenario: Estructura prevista para almacenamiento vectorial
- **WHEN** se inspecciona la estructura del servicio de IA
- **THEN** existe una abstracción de proveedor de almacenamiento vectorial (`VectorStoreProvider`) con una implementación mínima testeable, dejada como base para el futuro chatbot RAG

#### Scenario: Los modelos de Ollama no se descargan durante el bootstrap
- **WHEN** se inicia el servicio de IA
- **THEN** no se descargan ni se invocan los modelos `llama3.2` ni `nomic-embed-text` y únicamente queda preparada su configuración

### Requirement: Persistencia de la base de datos mediante volumen
La base de datos SQLite DEBE persistirse en `/app/data/finanzas.db` a través del volumen `finanzas_data` definido en Docker Compose.

#### Scenario: La base de datos sobrevive al reinicio del contenedor
- **WHEN** el contenedor escribe o modifica `/app/data/finanzas.db`
- **THEN** el archivo persiste en el volumen `finanzas_data` y continúa disponible tras reiniciar o reconstruir el contenedor

### Requirement: Arranque unificado con Docker Compose
La aplicación DEBE poder levantarse mediante `docker compose up -d --build app`. Los servicios DEBEN publicarse respetando los puertos definidos en la configuración del proyecto (backend 3001, IA 3002 y Ollama 11434). Los servicios DEBEN declarar dependencias entre sí de modo que el arranque de `app` deje disponibles también backend, ai y ollama.

#### Scenario: La aplicación se levanta con Docker Compose
- **WHEN** se ejecuta `docker compose up -d --build app` en la raíz del repositorio
- **THEN** los servicios definidos se construyen e inician sin errores y la aplicación queda disponible

#### Scenario: El arranque de app dispone de backend, ai y ollama
- **WHEN** se ejecuta `docker compose up -d --build app`
- **THEN** los servicios backend, ai y ollama quedan disponibles gracias a las dependencias declaradas entre servicios

#### Scenario: Los puertos definidos se mantienen
- **WHEN** los servicios se publican en el arranque
- **THEN** el backend se publica en el puerto 3001, la IA en el 3002 y Ollama queda disponible en el 11434