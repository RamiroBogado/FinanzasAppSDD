# FinanzasApp - Gestor de Finanzas Personales con Asistente IA

Sistema web completo para la gestión de finanzas personales multiusuario con un asistente inteligente integrado. Desarrollado siguiendo metodología spec-driven con OpenSpec.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express 5 (ESM) + better-sqlite3 |
| Base de Datos | SQLite (WAL mode) |
| Autenticación | JWT (HS256) + bcryptjs |
| Chatbot IA | FastAPI + LangChain + Ollama (llama3.1:8b + nomic-embed-text) |
| Vector Store | ChromaDB (colecciones por usuario + knowledge compartida) |
| Orquestación | Docker Compose |

---

## Funcionalidades Implementadas (100%)

| # | Funcionalidad | Descripción | Estado |
|---|--------------|-------------|--------|
| 1 | **Autenticación** | Registro, login JWT, refresh token, logout, forgot/reset password | ✅ |
| 2 | **Transacciones** | CRUD completo, ingreso/gasto, categorías, fecha, descripción, búsqueda y filtros | ✅ |
| 3 | **Categorías** | CRUD con colores, iconos, tipos (income/expense), seeder por defecto | ✅ |
| 4 | **Dashboard** | Balance mensual, gastos por categoría (torta), evolución mensual (barras), alertas | ✅ |
| 5 | **Presupuestos** | Definir por categoría/mes, barra de progreso, alertas 80%/100% | ✅ |
| 6 | **Metas de Ahorro** | Crear, depositar, retirar, progreso %, movimientos atómicos (goal + transacción) | ✅ |
| 7 | **Alertas** | Detección automática (rojo >100%, amarillo 80-100%), listar, marcar leídas | ✅ |
| 8 | **Búsqueda y Filtros** | Por tipo, categoría, rango fechas, texto libre, paginación | ✅ |
| 9 | **Exportar CSV** | Transacciones filtradas con cabeceras en español | ✅ |
| 10 | **Chatbot Asesor Financiero** | RAG con datos del usuario, consultas en lenguaje natural, acciones confirmadas | ✅ |
| 11 | **Rollover Mensual** | Arraste automático de saldo (income/expense) al iniciar sesión | ✅ |
| 12 | **Acciones del Chatbot** | Propuestas estructuradas con confirmación: crear/editar transacciones, categorías, presupuestos, metas, exportar | ✅ |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐       │
│  │ Dashboard │ │Transacc. │ │Categorías│ │ Presupuestos  │       │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘       │
│  ┌──────────┐ ┌──────────────────┐ ┌───────────────────┐        │
│  │  Metas   │ │ ChatBot Flotante │ │ Export CSV / Alerts│        │
│  └──────────┘ └──────────────────┘ └───────────────────┘        │
└────────────────────┬────────────────────────────┬────────────────┘
                     │ HTTP (proxy Vite)           │ HTTP (proxy Vite)
┌────────────────────▼──────────────────────┐  ┌────▼─────────────────────────────┐
│         Backend (Node.js + Express 5)       │  │  Microservicio IA (FastAPI)       │
│  ┌───────┐ ┌──────┐ ┌──────────┐ ┌───────┐  │  │ ┌─────────────────────────────┐  │
│  │ Users │ │ Auth │ │Transactions│      │  │  │ │ LangChain RAG:               │  │
│  └───────┘ └──────┘ └──────────┘      │  │  │ │ Indexer + Hybrid Retriever    │  │
│  ┌───────┐ ┌────────┐ ┌──────────┐    │  │  │ │ + Cross-Encoder Reranker      │  │
│  │Alerts │ │ Budget │ │ Goals    │    │  │  │ │ + Few-Shot + Function Calling │  │
│  └───────┘ └────────┘ └──────────┘    │  │  │ └──────────────┬──────────────┘  │
│  ┌──────────┐ ┌───────────────┐       │  │  │                │                 │
│  │Export CSV│ │ finanzas.db   │◄──────┼──┼──┤ lee finanzas.db (SQLite)        │  │
│  └──────────┘ └───────────────┘       │  │  └─────────────────────────────────┘  │
│  ┌───────────────┐ ┌────────────────┐  │  └──────────────────────────────────────┘
│  │Chat Actions   │ │ Rollover Track │  │
│  │(propuestas)   │ │ (mensual)      │  │
└───────────────────┴──────────────────┘
                     │
              ┌──────▼──────┐
              │  ChromaDB   │
              │ colecciones:│
              │ finanzas-user-{id}  │
              │ finanzas-knowledge  │
              └─────────────┘
                     │
              ┌──────▼──────┐
              │   Ollama    │
              │ llama3.1:8b │
              │ nomic-embed │
              └─────────────┘
```

---

## Servicio de IA (Chatbot) - Detalles Técnicos

El asistente financiero es un **microservicio Python** (`ai/`) con **FastAPI + LangChain**, integrado en el frontend como un **widget flotante** accesible desde cualquier página.

### Capacidades RAG Avanzadas

- **Hybrid Search**: BM25 + Vector Search con Reciprocal Rank Fusion (RRF)
- **Cross-Encoder Reranking**: `cross-encoder/ms-marco-MiniLM-L-6-v2` (CPU, local)
- **Few-Shot Prompting**: 5 ejemplos curados para guiar al LLM
- **Function Calling**: 5 herramientas tipadas via JSON Schema (`get_balance`, `get_transactions`, `get_budgets`, `get_goals`, `get_alerts`)
- **Action Proposals**: Parsing determinista para `create_category`, `create_transaction` + LLM fallback
- **Confirmación Explícita**: UI muestra resumen legible con botones Confirmar/Cancelar antes de ejecutar
- **Memoria Conversacional**: Historial aislado por usuario (ChromaDB `finanzas-user-{userId}`)

### Indexado Híbrido por Usuario

1. **Transacciones individuales** (últimas 50)
2. **Resúmenes mensuales por categoría** con % de presupuesto usado
3. **Presupuestos activos** con progreso
4. **Metas de ahorro** con progreso %
5. **Alertas no leídas**
6. **Documento Overview** (posición 0): balance, ingresos, gastos, top categorías, alertas
7. **Base de conocimiento compartida** (chunks estáticos: cómo usar la app + consejos financieros)

### Flujo de Consulta

1. Frontend envía mensaje a `POST /ai/chatbot/message` con JWT
2. Servicio verifica token, lee datos del usuario de SQLite
3. Si índice expiró (TTL 5 min) o no existe → reconstruye (embeddings `nomic-embed-text` → ChromaDB)
4. Pregunta se embediza → recupera **top-12** docs usuario + **top-2** knowledge (RRF + rerank)
5. Prompt combina: aggregates SQL exactos + docs recuperados + historial + few-shot + herramientas
6. `ChatOllama` (llama3.1:8b) genera respuesta o propuesta de acción estructurada
7. Si es acción: frontend muestra tarjeta de confirmación → usuario confirma → backend ejecuta revalidando

---

## Model Context Protocol (MCP)

Dos servidores MCP configurados en `opencode.json`:

### 1. Filesystem Server (Externo)
- **Fuente**: `@modelcontextprotocol/server-filesystem`
- **Rol**: Leer/escribir archivos del proyecto, exportar CSVs, gestionar configuración

### 2. Database Server (Externo)  
- **Fuente**: `@modelcontextprotocol/server-sqlite`
- **Rol**: Consultar directamente la base de datos SQLite para análisis y debugging

---

## AI Engineering - Metodología

### Desarrollo Spec-Driven (OpenSpec)

Cada cambio funcional pasa por:
1. **Propuesta** (`proposal.md`) - Qué, por qué, impacto
2. **Especificaciones** (`specs/*.md`) - Contratos, schemas, reglas
3. **Diseño** (`design.md`) - Arquitectura, UI, flujos
4. **Tareas** (`tasks.md`) - Checklist ejecutable
5. **Implementación** → Tests → Archive

### Changes Completados (Archivados)

| Change | Commit | PR | Descripción |
|--------|--------|----|-------------|
| `bootstrap-project` | 89425f0 | #17 | Setup monorepo, Docker, CI |
| `user-auth` | d4c9d44 | #19 | Registro, login JWT, password reset |
| `categories-filters` | 9287899 | #21 | CRUD categorías, filtros transacciones |
| `dashboard-budgets` | - | - | Dashboard gráficos, presupuestos mensuales |
| `transactions` | - | - | CRUD transacciones, búsqueda, paginación |
| `modern-ui` | - | - | Rediseño UI con Stitch, Tailwind |
| `savings-goals` | - | - | Metas de ahorro, depósitos, retiros |
| `transaction-exports` | - | - | Exportar CSV |
| `ai-chatbot` | - | - | Chatbot RAG básico (FastAPI + LangChain) |
| `saas-premium-ui` | - | - | UI premium, landing, pricing |
| `ai-vector-store` | 89425f0 | #17 | ChromaDB, embeddings, indexado híbrido |
| `financial-analytics` | - | - | Analytics avanzados |
| `ai-financial-advice` | 9287899 | #21 | Consejos financieros, few-shot |
| `chat-history` | d4c9d44 | #19 | Historial conversacional persistente |
| `categories-management` | - | - | UI gestión categorías integrada |
| `backend-hardening` | 6933e8c | #27 | JWT secret, Helmet, CORS, WAL, rate limit, password reset, pagination |
| `ui-creation-modals` | b2f7537 | #25 | Modales unificados con backdrop blur |
| `chatbot-actions` | 8373f41 | - | Propuestas de acción con confirmación, parsing determinista |

### Fixes Aplicados (No OpenSpec)

- `chatbot-data-freshness` (dac6edc): Documento overview consolidado + retrieval limits + race condition fix
- `rollover-duplication` (e5da312): Fix `getMissingMonths` para evitar duplicados en recarga

---

## Estructura del Proyecto

```
FinanzasAppSDD/
├── backend/                    # API REST (Node.js + Express 5 ESM)
│   ├── src/
│   │   ├── routes/             # auth, users, categories, transactions, budgets, goals, alerts, chat, export
│   │   ├── middleware/         # auth.js (JWT verification)
│   │   ├── app.js              # Express setup, Helmet, CORS, rate-limit, error handling
│   │   ├── server.js           # Entry point
│   │   ├── db.js               # SQLite connection (WAL mode)
│   │   ├── schema.js           # DDL: users, categories, transactions, budgets, goals, alerts, rollover_tracking, chat_actions, chat_action_audit
│   │   ├── users.js            # User service
│   │   ├── categories.js       # Categories service + seeder
│   │   ├── transactions.js     # Transactions service + rollover logic
│   │   ├── budgets.js          # Budgets service
│   │   ├── goals.js            # Goals service + atomic movements
│   │   ├── alerts.js           # Alerts service
│   │   ├── exporters.js        # CSV export
│   │   ├── chat.js             # Chat history persistence
│   │   └── chatActions.js      # Action proposals: create, confirm, cancel, audit
│   ├── package.json
│   └── .env
│
├── ai/                         # Microservicio Chatbot (FastAPI + LangChain)
│   ├── app/
│   │   ├── main.py             # FastAPI app: /chatbot/message, /chatbot/clear, /chatbot/tool, /health
│   │   ├── auth.py             # JWT verification (PyJWT HS256)
│   │   ├── config.py           # Settings: RETRIEVAL_LIMIT=12, KNOWLEDGE_LIMIT=2, RERANK_TOP_K=5, etc.
│   │   ├── chat.py             # build_reply_stream(), build_reply(), tools handling, action parsing
│   │   ├── data.py             # SQLite reads (user data for indexing)
│   │   ├── indexer.py          # Hybrid indexing: transactions, budgets, goals, alerts, overview
│   │   ├── knowledge.py        # Knowledge base chunks (static)
│   │   ├── vectorstore.py      # VectorStoreProvider (ChromaDB), BM25VectorStore, ChatHistoryVectorStore
│   │   └── __init__.py
│   ├── requirements.txt        # fastapi, langchain, chromadb, sentence-transformers, rank-bm25, ollama, etc.
│   ├── requirements-dev.txt    # pytest, pytest-mock
│   ├── tests/                  # 61 tests: app, hybrid_search, knowledge, reranker, eval, fewshot, tools, observability, cache
│   ├── eval/                   # Golden dataset (100 cases), eval CLI, CI gate (faithfulness≥0.8, recall@5≥0.7)
│   ├── knowledge/              # Markdown source for knowledge base
│   └── Dockerfile
│
├── frontend/                   # Web App (React 18 + Vite + Tailwind)
│   ├── src/
│   │   ├── api.js              # API client: auth, transactions, categories, budgets, goals, alerts, export, chat, chatActions
│   │   ├── components/
│   │   │   ├── AppLayout.jsx   # Sidebar, header, navigation
│   │   │   ├── AuthLayout.jsx  # Login/Register layout
│   │   │   ├── ChatWidget.jsx  # Floating chatbot with action cards, confirmation flow
│   │   │   ├── PeriodSelector.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ui/             # Button, Card, Input, Modal, Select, Table, Toast, etc.
│   │   ├── context/
│   │   │   └── AuthContext.jsx # JWT state, user, login/logout/register
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TransactionsPage.jsx
│   │   │   ├── CategoriesPage.jsx
│   │   │   ├── BudgetPage.jsx
│   │   │   ├── GoalPage.jsx
│   │   │   ├── AlertsPage.jsx
│   │   │   ├── ConfigPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── format.js           # Currency, date formatting (ES)
│   │   ├── categoryColor.js    # Color mapping utilities
│   │   ├── App.jsx             # Router + AuthProvider
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind imports + custom styles
│   ├── package.json
│   ├── vite.config.js          # Proxy /api → backend:3001, /ai → ai:3002
│   └── tailwind.config.js
│
├── openspec/                   # Spec-driven development artifacts
│   ├── config.yaml             # Workflow rules
│   └── changes/
│       └── archive/            # 18 changes archived with full specs
│
├── docker-compose.yml          # 5 services: backend, ai, ollama, ollama-init, app
├── AGENTS.md                   # Project rules, architecture, decisions, testing protocols
├── opencode.json               # MCP config, agent config
└── README.md
```

---

## Instalación y Ejecución

### Requisitos
- Node.js 18+
- Python 3.11+
- Ollama (para modelos LLM + embeddings)

### Desarrollo Local

**Backend:**
```bash
cd backend
npm install
npm run dev          # Puerto 3001
```

**Servicio IA:**
```bash
cd ai
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt    # Windows
# .venv/bin/pip install -r requirements.txt      # Linux/macOS
.venv\Scripts\uvicorn app.main:app --port 3002 --reload   # Windows
# .venv/bin/uvicorn app.main:app --port 3002 --reload      # Linux/macOS
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # Puerto 5173 (proxy /api→3001, /ai→3002)
```

**Ollama (modelos):**
```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

### Con Docker (Producción)
```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Chatbot API: http://localhost:3002
- Ollama: http://localhost:11434

El contenedor `ollama-init` descarga los modelos en el primer arranque.

---

## Testing

```bash
# Backend (159 tests)
cd backend && npm test

# Frontend (lint + build)
cd frontend && npm run lint && npm run build

# AI Service (61 tests)
cd ai && .venv\Scripts\python.exe -m pytest -q   # Windows
# cd ai && .venv/bin/python -m pytest -q        # Linux/macOS

# Evaluación RAG (golden dataset 100 casos)
cd ai && .venv\Scripts\python.exe scripts/eval.py --help
```

### CI Gates (GitHub Actions)
- Backend: lint + test
- AI: pytest + eval (faithfulness ≥ 0.8, recall@5 ≥ 0.7 - warning mode)
- Frontend: lint + build

---

## Variables de Entorno

### Backend (`backend/.env`)
```env
PORT=3001
DB_PATH=./finanzas.db
JWT_SECRET=your-secret-key
NODE_ENV=development
AI_SERVICE_URL=http://localhost:3002
```

### AI Service (`ai/.env` o docker-compose)
```env
OLLAMA_HOST=http://localhost:11434
JWT_SECRET=your-secret-key  # Debe coincidir con backend
DB_PATH=../backend/finanzas.db
VECTOR_STORE=chroma
CHROMA_PATH=./chroma
INDEX_TTL=300
RETRIEVAL_LIMIT=12
KNOWLEDGE_LIMIT=2
BM25_K=20
VECTOR_K=20
RRF_K=60
HYBRID_WEIGHT=0.5
RERANK_ENABLED=true
RERANK_TOP_K=5
RERANK_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2
FEWSHOT_ENABLED=true
FEWSHOT_TOP_K=3
TOOLS_ENABLED=true
```

---

## Decisiones Técnicas Clave

| Tema | Decisión |
|------|----------|
| **Autenticación** | JWT HS256, acceso a recursos filtrado por `user_id` en todas las queries |
| **Base de datos** | SQLite con WAL mode, índices compuestos para queries frecuentes |
| **Vector Store** | ChromaDB con colección por usuario (`finanzas-user-{id}`) + knowledge compartida |
| **Embeddings** | `nomic-embed-text` local vía Ollama (sin APIs externas) |
| **LLM** | `llama3.1:8b` local vía Ollama |
| **Reranking** | Cross-Encoder local (`ms-marco-MiniLM-L-6-v2`, CPU) |
| **Rollover** | Trigger en `/auth/me`, arranque desde mes siguiente al último procesado |
| **Acciones Chatbot** | Parsing determinista (regex) para create_category/create_transaction, LLM fallback |
| **Confirmación** | Token de un solo uso, TTL 5 min, idempotente, auditoría persistente |
| **Frontend Proxy** | Vite proxy `/api` → backend, `/ai` → ai-service |

---

## Agentes de opencode

### `git` (subagente)
Único autorizado para operaciones Git/GitHub. Invocado via `task` con `subagent_type=git`.

### `debugger` (subagente)
Diagnóstico de errores y limpieza de código en backend, frontend, IA. Ejecuta verificaciones obligatorias tras cada cambio.

---

## Licencia

Proyecto educativo / personal. Sin licencia específica.