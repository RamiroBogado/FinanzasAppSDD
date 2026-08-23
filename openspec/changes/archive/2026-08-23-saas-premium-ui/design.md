# Design: saas-premium-ui

## Context

El frontend ya cuenta con primitivas ui (`Button`, `Input`, `Field`, `EmptyState`, `Skeleton`, `PageHeader`, dialogs), Tailwind v4 con `@custom-variant dark` y `@theme` (solo `shadow-card` + animación de toast), dark mode persistido, toasts y un dashboard con donut de recharts. El look actual usa la fuente del sistema y la paleta indigo/slate por defecto, lo que se percibe genérico. Referencia estética: SaaS premium tipo Linear/Mercury, con dashboards densos estilo fintech del TP propio del usuario.

## Goals / Non-Goals

- Goals: identidad tipográfica propia, tokens semánticos centralizados, KPI cards fintech, auth split-screen, landing premium, micro-pulido transversal.
- Non-Goals: evolución mensual/gráficos agregados, colores por categoría, selector de período global, alertas de presupuesto (quedan para el change `financial-analytics`); cambio de acento de marca; cambios de backend/API; nuevas dependencias de UI (headlessui ya cubre diálogos).

## Decisions

### D1. Tipografía Inter Variable auto-hospedada

Nueva dependencia `@fontsource-variable/inter`: se importa en `main.jsx`, se registra como token `--font-sans` en `@theme` y queda aplicada vía base. Justificación de dependencia: auto-hospedada (offline, sin CDN externo ni FOUT de Google Fonts), variable (un solo archivo para todos los pesos), estándar del ecosistema SaaS premium.

### D2. Tokens en `@theme`

Tailwind v4 permite definir tokens nativos: `--font-sans`, colores semánticos reutilizando la paleta existente (`success` = emerald/green, `danger` = red, `warning` = amber), utilidad de montos `.amount` con `tabular-nums`, radios (`rounded-xl` estándar) y sombras (`shadow-card` ya existe). Los montos usan la clase utilitaria en tablas, KPIs y listados; el resto de la paleta no cambia para minimizar el diff.

### D3. KPI cards fintech

Componente liviano `StatCard` en `components/ui`: label, monto con `.amount`, chip circular con icono lucide sobre fondo semántico suave (`bg-emerald-100 text-emerald-600` claro / `/10 -600` oscuro). Dashboard pasa de 3 tarjetas planas a 4: Ingresos, Gastos, Balance, Ahorrado en metas (suma de `savedAmount` que el dashboard ya puede obtener de `api.listGoals`). Presupuestos y metas reutilizan el patrón donde hoy muestran totales simples.

### D4. Auth split-screen

Nuevo `components/AuthLayout.jsx`: grid de 2 columnas en `lg+`; panel izquierdo con gradiente oscuro (`slate-950 → indigo-950`), logo, tagline y lista de beneficios con iconos; panel derecho con el formulario existente centrado. Bajo `lg` solo formulario con header compacto de marca. Login y Registro consumen el layout sin cambiar su lógica de estado/submit.

### D5. Landing premium

Evolución de la HomePage actual manteniendo estructura: hero con badge/titular/CTA (ya existe) más una sección de vista previa del producto construida como mockup CSS (mini-dashboard estático: KPIs falsos + barras simuladas, sin imágenes), grilla de features ampliada a 6 (se suman Metas, Exportaciones y Asistente IA), sección de cierre con CTA repetido y footer simple con copyright. Todo CSS puro, sin capturas ni assets binarios.

### D6. Micro-pulido transversal

Pasada consistente: tamaños de icono estandarizados (16/18/20/24 según contexto), `transition-colors` en interactivos, hover states en filas de tablas, sombras `shadow-card` uniformes. Sin librerías de animación nuevas; las transiciones son CSS de Tailwind.

## Risks / Trade-offs

- [Fuente nueva] Inter Variable suma ~50 KB al bundle; aceptable por identidad visual.
- [Mockup estático] La vista previa de la landing es decorativa y puede desactualizarse respecto a la app real; se mantiene simple a propósito.
- [Alcance visual amplio] Toca muchas páginas; se mitiga verificando página por página en claro/oscuro durante la validación visual del usuario.

## Migration Plan

Sin cambios en backend ni datos. Rollback = revertir commit; la única dependencia nueva es de frontend y no afecta otros servicios.

## Open Questions

Ninguna.
