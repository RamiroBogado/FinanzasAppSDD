# Proposal: saas-premium-ui

## Why

La aplicación está funcionalmente completa y pulida (primitivas ui, skeletons, toasts, dark mode, charts), pero visualmente se percibe como un template genérico de Tailwind: tipografía del sistema, paleta por defecto y pantallas de auth anónimas. El usuario quiere que se sienta como una app real con estética SaaS premium (referencia Linear/Mercury), comparando contra un proyecto propio de finanzas personales cuyos dashboards lucen más densos y profesionales.

## What Changes

- Fundación tipográfica: Inter Variable auto-hospedada (`@fontsource-variable/inter`) y montos siempre con `tabular-nums` para alineación perfecta.
- Tokens de diseño centralizados en `@theme` (Tailwind v4): escala tipográfica, colores semánticos (ingreso/gasto/advertencia), radios y sombras unificados.
- KPI cards estilo fintech en el Dashboard: tarjetas con chip circular de icono de color semántico para Ingresos, Gastos, Balance y Metas de ahorro.
- Auth split-screen: nuevo `AuthLayout` compartido con panel izquierdo de marca (gradiente oscuro, logo, tagline, features) y formulario a la derecha; aplicado a Login y Registro.
- Landing pública premium: hero refinado, sección de vista previa del producto, grilla de features ampliada y footer.
- Micro-pulido transversal: iconografía consistente, estados hover/focus ricos, transiciones suaves y paridad total de dark mode.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `ui`: modifica `Sistema de diseño consistente` (tipografía Inter, tokens semánticos, tabular-nums) y `Landing pública` (vista previa del producto, features ampliadas, footer); agrega requirements de `Autenticación split-screen` y `KPI cards estilo fintech`.

## Impact

- Solo frontend: `frontend/package.json` (+1 dependencia justificada), `src/index.css`, `src/main.jsx`, páginas (`HomePage`, `LoginPage`, `RegisterPage`, `DashboardPage`, `AppPage`, `BudgetPage`, `GoalPage`), `AppLayout.jsx` y primitivas `components/ui/*`.
- Nuevo componente: `AuthLayout.jsx`.
- Sin cambios de backend, API ni specs funcionales. La verificación es lint + build + rebuild docker + validación visual.
