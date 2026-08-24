# Design: financial-analytics

## Context

El backend ya expone `GET /api/transactions` con filtros `from`/`to` validados, y presupuestos con `spent` calculado por mes y categoría; las categorías son texto libre (sin tabla de catálogo). El frontend ya carga la lista completa de transacciones en el Dashboard y usa Recharts (donut) más primitivas propias (`StatCard`, `EmptyState`). El servicio de IA no se ve afectado: consume la misma SQLite de forma solo lectura vía `DB_PATH` y su indexador RAG no depende de las nuevas columnas. La referencia de diseño es el TP del usuario: `PeriodContext` + `PeriodSelector` y rutas de alertas (`check`, `read`, `read-all`) que se adaptan al modelo local (mes único `AAAA-MM`, categorías como texto, montos en centavos).

## Goals / Non-Goals

**Goals:**

- Período global único, persistido, que gobierne Dashboard, Transacciones y Presupuestos.
- Evolución mensual de 6 meses con barras dobles ingresos/gastos.
- Colores deterministas por categoría reutilizables entre gráficos.
- Alertas persistentes por usuario con umbral configurable, página dedicada, badge y banner.

**Non-Goals:**

- Conversión o selección de moneda (ARS fijo).
- Notificaciones por email/push.
- Reglas de alertas distintas a umbrales de presupuesto.
- Modificar el servicio de IA ni su indexación.

## Decisions

### D1 — Período global con React Context + localStorage
`PeriodContext` guarda `{ month: 1..12, year }`, restaura desde `localStorage` (clave `finanzasapp-period`) validando rangos, default mes/año actual. `PeriodSelector` son dos `<select>` (mes, año ±1) ubicados bajo el logo en `AppLayout` (visible también en el panel mobile). Alternativa descartada: estado por página — duplicaría lógica y no da coherencia cross-página (motivación central del change).

### D2 — Acotación por período en cliente
Dashboard agrupa en memoria la lista completa ya obtenida filtrando por mes; Transacciones agrega `from`/`to` derivados del período a los params existentes (la API ya los valida); Presupuestos pasa `month=AAAA-MM` del período a `listBudgets` y elimina su selector local. Alternativa descartada: endpoint nuevo de resúmenes agregados en backend — innecesario para volúmenes personales, suma superficie de API y tests sin beneficio observable.

### D3 — Gráfico de evolución mensual
Agregación client-side sobre la lista completa: ventana de 6 meses terminando en el período seleccionado inclusive. Recharts `BarChart` con dos `Bar` (`income` verde semántico `--color-success-500`, `expense` rojo), tooltip con `formatAmount`. Sin datos en la ventana → `EmptyState`.

### D4 — Color estable por categoría
Helper `categoryColor(name)`: hash FNV-1a del nombre normalizado (trim + lowercase) → índice sobre paleta fija de 10 colores accesibles elegidos para ambos modos (evitando verdes/rojos semánticos reservados a ingresos/gastos). Determinista e independiente del orden. Se aplica en donut, lista de categorías del dashboard y puntos de color donde aparezca categoría. Alternativa descartada: asignar colores aleatorios persistidos — requiere almacenamiento y migración para poco beneficio.

### D5 — Migraciones SQLite guiadas por PRAGMA
En `schema.js`: `CREATE TABLE IF NOT EXISTS alerts (...)` nuevo y bloque PRAGMA que agrega `budgets.threshold INTEGER NOT NULL DEFAULT 80` si falta (patrón existente). Tabla `alerts`: `id TEXT PK (uuid)`, `user_id INTEGER NOT NULL`, `category TEXT NOT NULL`, `month TEXT NOT NULL ('AAAA-MM')`, `type TEXT NOT NULL CHECK (warning|danger)`, `message TEXT NOT NULL`, `read INTEGER NOT NULL DEFAULT 0`, `created_at TEXT NOT NULL (ISO datetime)` + índice `(user_id, read)`. Aislamiento: toda consulta filtra `user_id = req.userId`.

### D6 — Umbral en presupuestos
Validación espejo de `amount`: entero entre 1 y 100, opcional → 80 en creación, conservar en edición. Respuestas públicas incluyen `threshold`.

### D7 — API de alertas adaptada del TP
Rutas `/api/alerts`: `GET /` (propias, `ORDER BY created_at DESC LIMIT 50`), `POST /check` (`{month?}` AAAA-MM opcional; evalúa presupuestos del usuario+mes con `spent`; crea `danger` si `spent > amount`, si no `warning` si `spent >= amount*threshold/100`; dedupe por `(user_id, category, month, type)` comparación case-insensitive coherente con presupuestos), `PUT /:id/read` (404 ajena/inexistente), `POST /read-all`. Mensajes en español con montos formateados ARS server-side (`Intl.NumberFormat('es-AR')`). Diferencias con TP: mes único en vez de `month`+`year`, categoría texto libre, umbral entero.

### D8 — Disparo de la verificación
El frontend llama `POST /api/alerts/check` con el mes del período: al cargar el Dashboard (efecto dependiente del período) y tras crear/editar/eliminar una transacción (fire-and-forget). Tras cada check o marca de lectura se refresca el badge mediante un evento DOM `alerts-updated` que escucha `AppLayout`. Alternativa descartada: job programático server-side — sin planificador disponible y acoplado a infraestructura.

### D9 — Página Alertas y navegación
`AlertsPage.jsx` en ruta protegida `/alertas`: lista tipo (chip semántico), mensaje y fecha relativa, acciones `Marcar leída` y `Marcar todas`; acceso `Alertas` (icono Bell) en sidebar con badge numérico cuando hay no leídas; banner en Dashboard con conteo y link. Integración proxy Vite existente (`/api` → backend:3001, JWT compartido); sin cambios en `ai/` ni `VectorStoreProvider`.

### D10 — Sin dependencias nuevas
Recharts, lucide-react y headlessui ya cubren gráfico, iconos y accesibilidad; uuid ya está en dependencias del backend. No se introducen tecnologías nuevas.

## Risks / Trade-offs

- [Lista completa de transacciones en cliente para agregar evolución] → Volúmenes personales acotados; si crece, un change futuro puede mover agregaciones a endpoint dedicado sin cambiar specs observables.
- [Dedup de alertas por combinación lógica permite mensajes desactualizados si el gasto baja] → Aceptado: refleja el histórico del período; marcar leída es el mecanismo de limpieza, igual que en el TP de referencia.
- [`threshold` REAL vs INTEGER en bases existentes] → ALTER declara INTEGER con DEFAULT 80; SQLite es dinámico pero la validación de entrada garantiza enteros.
- [Check concurrente desde varias pestañas podría duplicar alertas] → Dedupe previo por consulta dentro del mismo proceso better-sqlite3 (single-writer) hace la carrera inofensiva.
- [Cambio de alcance en Transacciones altera comportamiento percibido] → Spec MODIFIED explícita; `Limpiar filtros` conserva el período para evitar sorpresas.
