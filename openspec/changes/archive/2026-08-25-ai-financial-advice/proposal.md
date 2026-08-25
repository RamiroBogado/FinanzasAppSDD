# Proposal: ai-financial-advice

## Why

El chatbot de IA responde exclusivamente con los datos financieros del usuario (transacciones, presupuestos, metas), pero no puede orientar sobre buenas prácticas financieras, estrategias de ahorro, manejo de deuda ni conceptos básicos de inversión. Agregar una base de conocimiento de consejos financieros generales enriquece las respuestas del asistente sin comprometer el aislamiento de datos entre usuarios.

## What Changes

- Se crea un directorio `ai/knowledge/` con archivos markdown que contienen consejos financieros generales en español (presupuesto, ahorro, deuda, inversiones, fondo de emergencia).
- El servicio de IA indexa estos documentos en una colección ChromaDB compartida de solo lectura (`finanzas-knowledge`), separada de las colecciones por usuario.
- Ante cada pregunta, el servicio combina los documentos del usuario (top ~6) con los documentos de conocimiento más relevantes (top ~4) para construir el prompt.
- Se ajusta el system prompt para que el modelo distinga entre datos financieros del usuario (fuentes de hechos) y consejos generales (guía orientativa).
- Se agrega configuración `KNOWLEDGE_DIR` y `KNOWLEDGE_LIMIT` al servicio de IA.

## Capabilities

### New Capabilities

- `ai-knowledge`: base de conocimiento de solo lectura con documentos markdown de consejos financieros generales, indexados en una colección ChromaDB compartida y recuperados por similitud semántica junto con los datos del usuario.

### Modified Capabilities

- `chatbot`: la requirement "Contexto limitado al usuario autenticado" se aclara para indicar que, además de los datos financieros propios del usuario, el servicio puede incluir documentos de conocimiento general del asistente, nunca datos financieros de otros usuarios.

## Impact

- **ai/**: nuevo módulo `app/knowledge.py` (KnowledgeIndex), modificaciones en `app/config.py` (KNOWLEDGE_DIR, KNOWLEDGE_LIMIT), `app/indexer.py` (retrieval combinado), `app/chat.py` (system prompt), `app/main.py` (inyectar knowledge_index), nuevo directorio `knowledge/` con archivos .md, tests pytest nuevos.
- **No se modifican**: backend, frontend, docker-compose.yml, esquema de base de datos, ni dependencias externas.
