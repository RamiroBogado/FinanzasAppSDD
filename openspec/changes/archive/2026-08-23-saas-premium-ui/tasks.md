# Tasks: saas-premium-ui

## 1. Setup

- [x] 1.1 Crear rama `feature/saas-premium-ui`, issue en repo y ítem en board #3 (`@Board FinanzasAppSDD`) con Status `Todo` vía agente git
- [x] 1.2 Agregar `@fontsource-variable/inter` e importar en `main.jsx`

## 2. Fundación de diseño

- [x] 2.1 Tokens en `index.css`: `--font-sans` Inter, utilidad `.amount` con tabular-nums, tokens semánticos success/danger/warning
- [x] 2.2 Aplicar `.amount` a montos en Dashboard, Transacciones, Presupuestos, Metas y ChatWidget

## 3. Componentes y pantallas

- [x] 3.1 Crear `StatCard.jsx` (chip circular semántico + monto) y usarlo en las 4 KPI cards del Dashboard
- [x] 3.2 Crear `AuthLayout.jsx` split-screen y aplicarlo a Login y Registro
- [x] 3.3 Landing premium: hero refinado, mockup CSS de vista previa, grilla de 6 features, sección CTA final y footer

## 4. Pulido transversal

- [x] 4.1 Estandarizar iconos, hover states de tablas/filas y transiciones en páginas autenticadas
- [x] 4.2 Revisar paridad claro/oscuro en todas las superficies modificadas

## 5. Verificación y cierre

- [x] 5.1 Correr frontend lint + build y rebuild docker del servicio app
- [x] 5.2 Validación visual del usuario en claro/oscuro y mobile
- [ ] 5.3 Archive del change, board `Done`, commit y push vía agente git
