# Design: modern-ui

## Context

El frontend es React 18 + Vite + Tailwind CSS v4 (config CSS-first con `@import "tailwindcss"` en `index.css`) + React Router 7. Existen ocho vistas (`HomePage`, `LoginPage`, `RegisterPage`, `AppLayout`, `DashboardPage`, `AppPage`, `BudgetPage` y `ProtectedRoute`), helpers centralizados en `api.js` y `format.js`, y estado de auth en `AuthContext`. No hay tokens de diseño, iconos, toasts ni modo oscuro. Las specs vigentes fijan textos y comportamientos (ver specs de `transactions`, `budgets`, `dashboard`) que este change preserva; solo agrega la capability `ui`.

## Goals / Non-Goals

**Goals**
- Sistema de diseño unificado basado en primitivas propias reutilizables.
- Modo claro/oscuro persistente con preferencia del sistema como inicial.
- Landing pública, shell responsive y feedback transversal (toasts, confirmación, skeletons, vacíos).
- Donut de gastos por categoría en el dashboard.

**Non-Goals**
- Cambios de backend, API o capa IA.
- Nueva funcionalidad financiera (metas, exportaciones, chatbot).
- Tests E2E automatizados (la verificación sigue siendo lint+build y validación manual/docker).

## Decisions

1. **Headless UI v2 sobre Radix UI.** Se necesita Dialog, Switch y Transition accesibles sin estilos impuestos. Headless UI cubre exactamente eso con una API mínima y un solo paquete (`@headlessui/react`); Radix exige instalar un paquete por componente. Alternativa descartada: implementar diálogos a mano (riesgo de accesibilidad y foco).
2. **lucide-react para iconos.** Paquete único, tree-shakeable, estilo consistente con UI SaaS moderna. Alternativa descartada: SVGs copiados a mano (mantenimiento) o font icons (peor rendimiento).
3. **recharts para el donut.** Solo se usa `PieChart/Pie/Cell/Tooltip`; es la librería de gráficos más adoptada en React, soporta React 18 y evita escribir SVG matemático a mano. Alternativa considerada: donut SVG propio sin dependencia (más código y sin tooltips accesibles); se descarta porque el usuario pidió explícitamente recharts.
4. **Toasts propios con contexto.** Headless UI no trae Toast. `ToastProvider` + hook `useToast` (~100 líneas) con `Transition`, apilados abajo a la derecha, autodescarte a los 4 s. Alternativa descartada: `react-hot-toast` (otra dependencia para algo resuelto con poco código).
5. **Dark mode por clase `.dark` en `<html>`.** Tailwind v4: `@custom-variant dark (&:where(.dark, .dark *))`. `ThemeContext` aplica/quita la clase, guarda en `localStorage` (`finanzasapp-theme`: `light`/`dark`) y usa `matchMedia('(prefers-color-scheme: dark)')` solo si no hay elección guardada. El script de inicialización vive en `ThemeContext` (no en `index.html`) para mantener un único proveedor React; el flash inicial aceptable por ser SPA local. Toggle visible solo dentro del área autenticada (sidebar), según spec.
6. **Tokens en `@theme` de Tailwind v4.** Marca única `indigo` (primario, hover `-500`/`-700`, anillos `-400`); superficies con `slate` existente; radios `rounded-xl` para tarjetas y `rounded-lg` para controles; sombras `shadow-sm`/`shadow-md`. Tipografía: stack system-ui por defecto (sin webfont para no agregar peso ni dependencia). Foco visible global vía `focus-visible:ring-2 ring-indigo-400` en las primitivas y clases base en `index.css`.
7. **Primitivas en `components/ui/`.** `Button` (variantes `primary|secondary|ghost|danger`, tamaños `sm|md`, prop `as` no necesario: los links del landing usan clases compartidas exportadas), `Input`, `Select` (wrapper con label opcional), `Skeleton` (bloques animados `animate-pulse`), `EmptyState` (icono lucide + título + descripción opcional), `ConfirmDialog` (Dialog de Headless UI con título/pregunta y acciones `Eliminar`/`Cancelar`), `ToastProvider`/`useToast`. Sin Storybook: se validan en las páginas mismas.
8. **AppLayout responsive.** Desktop: sidebar fija `w-64` que colapsa a `w-[4.5rem]` (solo iconos con `title` nativo) mediante toggle con `PanelLeftClose`/`PanelLeftOpen`; estado del colapso también en `localStorage`. Mobile (< `md`): sidebar oculta; header fijo con botón hamburguesa (`Menu`) que abre la misma navegación como panel superpuesto con overlay, cerrado al navegar. NavLink activo con fondo `indigo` suave. Username + `Cerrar sesión` conservados en ambas variantes.
9. **Landing en `HomePage`.** Navbar pública (marca + links auth), hero con gradiente decorativo (`from-indigo-600`), tres features con iconos (`ArrowLeftRight`, `PieChart`, `Wallet`), CTA final y footer simple. Todo texto nuevo definido en la spec `ui`.
10. **Donut en DashboardPage.** Agregación client-side ya existente (`expensesByCategory`); se alimenta `PieChart` con datos `{ name, value }`, colores de una paleta fija cíclica, tooltip con formato ARS vía `formatter={(value) => formatAmount(value)}`. El listado textual se conserva debajo/lado según ancho.
11. **Textos contractuales intactos.** Los textos fijados por specs (`Agregar transacción`, `Agregar presupuesto`, `Guardar cambios`, `Cancelar`, `Editar`, `Eliminar`, `Limpiar filtros`, `Presupuesto excedido`, opciones `Ingreso`/`Gasto`, mensajes vacíos actuales) no cambian. Los mensajes de carga (`Cargando…`) desaparecen a favor de skeletons, permitido porque ninguna spec los menciona.

## Risks / Trade-offs

- [recharts agranda el bundle] → import directo de componentes usados; el warning preexistente de chunk > 500 kB es aceptable según convenciones del proyecto.
- [Flash de tema incorrecto al recargar] → mitigado aplicando clase en el primer render de `ThemeContext`; residual aceptable en SPA local.
- [Drawer mobile y foco atrapado] → usar Dialog de Headless UI para el panel mobile garantiza foco y cierre con Escape.
- [Regresión visual en flujos existentes] → los textos y comportamientos spec-fijados se verifican explícitamente en la validación docker/UI antes del archive.

## Migration Plan

Rama `feature/modern-ui`; implementación incremental por tareas (tokens → primitivas → shell → páginas). Verificación con lint + build y stack docker validando claro/oscuro, mobile y flujos completos con dos usuarios. Rollback: borrar la rama; `master` permanece en `363597a`.

## Open Questions

Ninguna.
