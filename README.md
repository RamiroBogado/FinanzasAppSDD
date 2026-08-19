# Finanzas Personales - Gestor Financiero con Asistente IA

Sistema web completo para la gestión de finanzas personales con un asistente inteligente integrado. Desarrollado delegando la programación operativa a agentes autónomos de IA.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express |
| Base de Datos | SQLite (better-sqlite3) |
| Autenticación | JWT + bcryptjs |
| Chatbot | Microservicio Python (FastAPI + LangChain) + Ollama (llama3.2, nomic-embed-text) |
| MCP | Filesystem Server + Database Server |

---

## 10 Casos de Uso

| # | Caso de Uso | Estado | Endpoint |
|---|------------|--------|----------|
| 1 | **Registro y autenticación** - Crear cuenta e iniciar sesión con JWT | ✅ | `POST /api/users/register`, `POST /api/users/login` |
| 2 | **Agregar transacción** - Registrar ingreso/gasto con categoría, monto, fecha y descripción | ✅ | `POST /api/transactions` |
| 3 | **CRUD categorías** - Crear, editar y eliminar categorías personalizadas con color | ✅ | `GET/POST/PUT/DELETE /api/categories` |
| 4 | **Dashboard con gráficos** - Balance mensual, gastos por categoría (torta), evolución mensual (barras) | ✅ | `GET /api/transactions/dashboard` |
| 5 | **Presupuesto mensual** - Definir presupuesto por categoría de gasto con barra de progreso y alertas | ✅ | `GET/POST/PUT/DELETE /api/budgets` |
| 6 | **Metas de ahorro** - Crear meta, depositar dinero, ver progreso en porcentaje | ✅ | `GET/POST/DELETE /api/savings`, `POST /api/savings/:id/deposit` |
| 7 | **Alertas automáticas** - Detecta cuando un presupuesto se excede (rojo) o llega al 80% (amarillo) | ✅ | `GET /api/alerts`, `POST /api/alerts/check` |
| 8 | **Búsqueda y filtros** - Filtrar transacciones por tipo, categoría, rango de fechas y texto | ✅ | `GET /api/transactions?type=&category_id=&start_date=&end_date=&search=` |
| 9 | **Exportar reportes CSV** - Descargar transacciones filtradas como archivo CSV | ✅ | `GET /api/export/csv` |
| 10 | **Chatbot asesor financiero** - Consultar finanzas personales con asistente IA (FastAPI + LangChain + RAG) | ✅ | `POST /ai/chatbot/message` |

**Cobertura: 10/10 casos de uso implementados y funcionales.**

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Dashboard │ │Transacc. │ │Categorías│ │ Presupuestos  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────────────┐ ┌───────────────────┐   │
│  │  Metas   │ │ ChatBot Flotante │ │ Export CSV        │   │
│  └──────────┘ └──────────────────┘ └───────────────────┘   │
└────────────────────┬──────────────────────────┬─────────────┘
                     │ HTTP (proxy Vite)          │ HTTP (proxy Vite)
┌────────────────────▼──────────────────┐  ┌─────▼────────────────────────────┐
│     Backend (Node.js + Express)        │  │ Microservicio IA (FastAPI)       │
│  ┌───────┐ ┌──────┐ ┌──────────┐      │  │ ┌─────────────────────────────┐  │
│  │ Users │ │  Cat │ │ Transac. │      │  │ │  LangChain RAG:              │  │
│  └───────┘ └──────┘ └──────────┘      │  │ │  Indexer + Retriever         │  │
│  ┌───────┐ ┌────────┐ ┌──────────┐    │  │ │  + VectorStore (embeddings)  │  │
│  │Alerts │ │ Budget │ │ Savings  │    │  │ └──────────────┬──────────────┘  │
│  └───────┘ └────────┘ └──────────┘    │  │                │                 │
│  ┌──────────┐ ┌───────────────┐       │  │  ┌─────────────▼──────────────┐  │
│  │Export CSV│ │ finanzas.db   │◄──────┼──┼──┤ lee finanzas.db (SQLite)    │  │
│  └──────────┘ └───────────────┘       │  │  └─────────────────────────────┘  │
└────────────────────────────────────────┘  └───────────────┬──────────────────┘
                                                            │ HTTP
                                                   ┌────────▼────────┐
                                                   │ Ollama          │
                                                   │ llama3.2 +      │
                                                   │ nomic-embed-text│
                                                   └─────────────────┘
┌──────────────────────────────────────────────────────────────┐
│                    MCP Servers                                │
│  ┌─────────────────┐  ┌──────────────────────────────────┐   │
│  │ Filesystem Server │  │      Database Server (SQLite)   │   │
│  └─────────────────┘  └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. El usuario interactúa con el frontend React
2. Las peticiones pasan por el proxy de Vite: `/api` → backend Express (Node) y `/ai` → microservicio FastAPI (Python)
3. El backend Node procesa la lógica de negocio contra SQLite
4. El servicio IA verifica el JWT, indexa/consulta el vector store con los datos del usuario y genera la respuesta con LangChain + Ollama
5. Los MCP servers permiten al agente de IA acceder al filesystem y la base de datos durante el desarrollo

---

## Model Context Protocol (MCP)

Se integraron **2 servidores MCP**, cumpliendo con el mínimo requerido:

### 1. Filesystem Server (Externo)
- **Fuente:** Externo (`@modelcontextprotocol/server-filesystem`)
- **Rol:** Permite al agente IA leer/escribir archivos del proyecto, exportar CSVs y gestionar archivos de configuración
- **Comando:** `npx -y @modelcontextprotocol/server-filesystem`

### 2. Database Server (Externo)
- **Fuente:** Externo (`@modelcontextprotocol/server-sqlite`)
- **Rol:** Permite al agente IA consultar directamente la base de datos SQLite para análisis y debugging
- **Comando:** `npx -y @modelcontextprotocol/server-sqlite`

**Configuración en `opencode.json`:**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "RUTA_DEL_PROYECTO"]
    },
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "RUTA/finanzas.db"]
    }
  }
}
```

---

## Chatbot Integrado (FastAPI + LangChain + RAG)

El asistente financiero es un **microservicio Python** (`ai/`) con **FastAPI + LangChain**, integrado en el frontend como un **componente flotante** accesible desde cualquier página. Reemplaza la integración directa a Ollama que vivía en el backend Node.

### Características
- **RAG con LangChain:** Indexa los datos financieros del usuario en un vector store y recupera los documentos más relevantes por similitud semántica antes de responder
- **Indexado híbrido:** Transacciones individuales + resúmenes mensuales por categoría (con % de presupuesto usado) + presupuestos + metas de ahorro + alertas + base de conocimiento
- **Base de conocimiento:** Chunks estáticos con cómo usar la app y consejos financieros que el bot también puede consultar
- **Embeddings locales:** `nomic-embed-text` vía Ollama (sin servicios externos)
- **Vector store:** `InMemoryVectorStore` de LangChain, detrás de un wrapper (`VectorStoreProvider`) que permite migrar a ChromaDB sin tocar el resto
- **Memoria conversacional:** Recuerda el contexto de la conversación (últimos 20 mensajes)
- **Interfaz:** Modal flotante con burbujas de chat, indicador de escritura y botón para reiniciar

### Arquitectura del servicio (`ai/`)

```
ai/
├── main.py            # FastAPI: POST /chatbot/message, /chatbot/clear, GET /health
├── auth.py            # Verifica el mismo JWT del backend Node (PyJWT, HS256)
├── db.py              # Lectura de finanzas.db (misma SQLite del backend)
├── chatbot.py         # Orquestación: memoria, prompt del sistema, RAG + LLM
├── knowledge_base.py  # Chunks estáticos (cómo usar la app + consejos financieros)
└── rag/
    ├── embeddings.py  # OllamaEmbeddings (nomic-embed-text)
    ├── llm.py         # ChatOllama (llama3.2)
    ├── vector_store.py# Wrapper VectorStoreProvider (MemoryVectorStore hoy)
    ├── indexer.py     # Construye documentos por usuario (híbrido)
    └── retriever.py   # Búsqueda top-k + armado del contexto
```

### Flujo RAG
1. El frontend envía el mensaje a `POST /ai/chatbot/message` con el JWT
2. El servicio verifica el token y lee los datos del usuario de `finanzas.db`
3. Si el índice del usuario expiró (TTL 5 min) o no existe, se reconstruye: se embedizan los documentos con `nomic-embed-text` y se guardan en el vector store
4. La pregunta se embediza y se recuperan los **top-8** documentos más similares (datos del usuario) + top-3 de la base de conocimiento
5. El prompt del sistema combina agregados exactos (SQL), los documentos recuperados y el historial
6. `ChatOllama` (llama3.2) genera la respuesta con ese contexto

### Instalación de Ollama
```bash
# Descargar e instalar Ollama desde https://ollama.com
# Luego descargar los modelos (LLM + embeddings):
ollama pull llama3.2
ollama pull nomic-embed-text
```

---

## AI Engineering - Justificación del Proceso

### Metodología de Desarrollo

El desarrollo se realizó mediante **iteraciones asistidas por IA**, estructurando el sistema en capas:

1. **Definición de requerimientos:** Se establecieron 10 casos de uso funcionales antes de escribir código
2. **Arquitectura primero:** Se definió el stack, la estructura de carpetas y el esquema de BD
3. **Backend primero:** Cada caso de uso se implementó primero como endpoint REST
4. **Frontend después:** Se construyó la interfaz consumiendo los endpoints ya funcionales
5. **Verificación continua:** Cada endpoint se probó antes de pasar al siguiente

### Prompts Clave Utilizados

| Propósito | Prompt |
|-----------|--------|
| Definición inicial | "Quiero un gestor de finanzas personales con React y Node.js" |
| Estructura de BD | Necesito SQLite con tablas para users, categories, transactions, budgets, savings_goals, alerts |
| Autenticación | "Implementar JWT con bcryptjs, rutas de register y login" |
| Dashboard | "Endpoint de dashboard que devuelva balance, gastos por categoría, evolución mensual" |
| Chatbot | "Chatbot con LangChain (Python), RAG con embeddings locales, contexto financiero del usuario" |
| MCP | "Configurar servidores MCP de filesystem y database" |

### Loops de Autocorrección

Durante el desarrollo se identificaron y corrigieron automáticamente:

1. **Error de relación:** Al eliminar categorías con transacciones asociadas → Se agregó validación con conteo previo
2. **Chatbot sin conexión:** Si Ollama no está corriendo → Se agregó manejo de error con mensaje amigable
3. **Presupuestos duplicados:** Se validó que no exista un presupuesto para la misma categoría y mes
4. **Fechas en dashboard:** Las consultas mensuales se ajustaron para usar `strftime` de SQLite
5. **Compatibilidad LangChain:** `MemoryVectorStore` fue removido en langchain-community reciente → Se migró a `InMemoryVectorStore` de `langchain-core`, detrás de un wrapper `VectorStoreProvider` listo para ChromaDB

### Estructura de Instrucciones del Sistema (`.opencode/instructions.md`)

Se definió un archivo de reglas de contexto con:
- Stack tecnológico y arquitectura
- Patrones de diseño a seguir
- Reglas de estilo de código
- Flujo de iteración
- Configuración de MCP

---

## Agentes de opencode

### git (subagente git-only)

Agente dedicado **exclusivamente** a operaciones de Git y GitHub. Solo puede ejecutar comandos `git` y `gh` en la terminal; no edita archivos ni corre otro tipo de comandos (npm, docker, etc.).

**Cómo invocarlo:** pedile al agente build una operación de Git/GitHub (por ej. "que el agente git haga status y diff", "commitear estos cambios", "crear un PR con gh") y delegará en el subagente `@git`. Solo se activa cuando se lo pide explícitamente.

**Alcance:**
- `git`: status, diff, log, add, commit, push, pull, branch, stash, tag (operaciones que mutan estado requieren confirmación explícita del usuario)
- `gh`: pr, issue, release, contra `RamiroBogado/FinanzasApp`
- Configuración: `.opencode/agent/git.md` (modo subagente, `edit: deny`, terminal restringida a patrones `git *` y `gh *`)

### debugger (debug y limpieza de código)

Agente dedicado a **diagnosticar errores** y **limpiar código** en las tres capas del proyecto (backend Express, frontend React/Vite, microservicio IA FastAPI/LangChain). Modo `all`: se puede invocar como subagente (`@debugger`) o seleccionarlo directamente en opencode con Tab.

**Qué hace:**
- Reproduce el error (logs, stacktraces, pruebas de endpoint), encuentra la causa raíz, aplica el fix con confirmación y entrega un reporte de limpieza (qué se eliminó y por qué)
- Limpieza segura: dead code, imports sin uso, logs de debug, TODOs obsoletos, código comentado
- Nunca ejecuta git/commits (eso lo maneja el agente `git`)

**Chequeos de verificación que usa obligatoriamente tras cada cambio:**
- Backend: `npm run lint` y `npm test` (ESLint + Vitest)
- Frontend: `npm run lint` y `npm run build` (ESLint + Vite)
- Microservicio IA: `pytest` (venv de `ai/`, dependencias en `ai/requirements-dev.txt`)

Configuración: `.opencode/agent/debugger.md`.

---

## Instalación y Ejecución

### Requisitos
- Node.js 18+
- npm
- Python 3.11+ (para el microservicio IA)
- Ollama (para el chatbot - opcional)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Microservicio IA (Chatbot RAG)
```bash
cd ai
python -m venv .venv           # opcional pero recomendado
.venv\Scripts\pip install -r requirements.txt   # Windows
# .venv/bin/pip install -r requirements.txt     # Linux/macOS
.venv\Scripts\uvicorn main:app --port 3002     # Windows
# .venv/bin/uvicorn main:app --port 3002        # Linux/macOS
```
Variables de entorno opcionales: `OLLAMA_URL` (default `http://localhost:11434`), `JWT_SECRET` (debe coincidir con el backend), `DB_PATH` (default `../backend/finanzas.db`), `INDEX_TTL` (segundos, default 300).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
El proxy de Vite redirige `/api` a `:3001` (Node) y `/ai` a `:3002` (Python).

### Chatbot (Ollama)
```bash
# Instalar Ollama desde https://ollama.com
ollama pull llama3.2
ollama pull nomic-embed-text
# El servicio IA se conecta automáticamente en http://localhost:11434
```

### Acceso
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Chatbot API: http://localhost:3002

### Con Docker
```bash
docker compose up --build
```
- App: http://localhost:3001
- Chatbot: http://localhost:3002
- El contenedor `ollama` descarga los modelos `llama3.2` y `nomic-embed-text` en el primer arranque (puede tardar)

---

## Estructura del Proyecto

```
TP/
├── backend/
│   ├── src/
│   │   ├── routes/          # users, categories, transactions, budgets, savings, alerts, export
│   │   ├── middleware/       # JWT authentication
│   │   ├── db.js            # SQLite connection + schema
│   │   └── server.js        # Express entry point
│   ├── .env                 # Config (JWT_SECRET, PORT)
│   └── package.json
├── ai/                      # Microservicio chatbot IA (FastAPI + LangChain)
│   ├── main.py             # FastAPI app (rutas del chatbot)
│   ├── auth.py             # Verificación JWT (PyJWT)
│   ├── db.py               # Lectura de SQLite
│   ├── chatbot.py          # Orquestación RAG + LLM
│   ├── knowledge_base.py   # Base de conocimiento estática
│   ├── rag/                # embeddings, llm, vector_store, indexer, retriever
│   ├── requirements.txt    # Dependencias Python
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # AuthContext, Layout, ChatBot
│   │   ├── pages/           # Login, Register, Dashboard, Transactions, Categories, Budgets, Savings
│   │   ├── api/             # API client helper
│   │   ├── App.jsx          # Router setup
│   │   └── main.jsx         # Entry point
│   └── package.json
├── .opencode/
│   └── instructions.md      # AI Engineering context rules
├── opencode.json            # MCP server configuration
└── README.md                # Documentation
```
