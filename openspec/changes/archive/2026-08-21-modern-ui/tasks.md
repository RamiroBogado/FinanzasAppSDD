# Tasks: modern-ui

## 1. Setup

- [x] 1.1 Crear rama `feature/modern-ui` y issue en board #3 (`@Board FinanzasAppSDD`) con Status `Todo` vía agente git
- [x] 1.2 Instalar `lucide-react`, `@headlessui/react` y `recharts` en `frontend/`

## 2. Sistema de diseño

- [x] 2.1 Definir tokens en `index.css`: variante dark por clase, foco visible global, base de tipografía
- [x] 2.2 Crear `context/ThemeContext.jsx` con preferencia del sistema, persistencia en localStorage y clase `.dark` en `<html>`
- [x] 2.3 Crear primitivas en `components/ui/`: `Button`, `Input`, `Select`, `Skeleton`, `EmptyState`
- [x] 2.4 Crear `ConfirmDialog` con Headless UI Dialog (pregunta, acciones `Eliminar`/`Cancelar`)
- [x] 2.5 Crear `ToastProvider` + hook `useToast` con toasts temporales apilados

## 3. Shell responsive

- [x] 3.1 Rehacer `AppLayout.jsx`: sidebar colapsable a iconos en desktop, drawer mobile con hamburguesa, toggle de tema, username y `Cerrar sesión`
- [x] 3.2 Montar `ToastProvider` y `ThemeProvider` en `main.jsx`

## 4. Páginas públicas

- [x] 4.1 Rehacer `HomePage.jsx` como landing (navbar, hero, features, CTA, footer)
- [x] 4.2 Rehacer `LoginPage.jsx` y `RegisterPage.jsx` con primitivas del sistema

## 5. Páginas protegidas

- [x] 5.1 Rediseñar `DashboardPage.jsx`: cards con tokens, donut recharts de gastos por categoría, skeletons y estados vacíos
- [x] 5.2 Rediseñar `AppPage.jsx`: primitivas, skeletons, estados vacíos, confirm dialog al eliminar y toasts de alta/edición/eliminación
- [x] 5.3 Rediseñar `BudgetPage.jsx`: primitivas, skeletons, estado vacío, confirm dialog al eliminar y toasts de alta/edición/eliminación

## 6. Verificación

- [x] 6.1 Ejecutar `npm run lint` y `npm run build` en frontend sin errores
- [x] 6.2 Levantar stack docker y validar flujos completos con dos usuarios en claro/oscuro y viewport mobile
- [x] 6.3 Validar textos contractuales preservados (`Agregar transacción`, `Agregar presupuesto`, `Guardar cambios`, `Limpiar filtros`, `Presupuesto excedido`, mensajes vacíos)
