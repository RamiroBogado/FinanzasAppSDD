# Proposal: modern-ui

## Why

La interfaz actual es funcional pero visualmente inconsistente: conviven dos colores de marca (`blue-600` en auth, `slate-800` en el shell), la página pública (`/`) es un placeholder sin información del producto, la navegación no funciona en mobile y el feedback de las operaciones se limita a cajas de error inline sin estados de carga ni vacíos diseñados. Para que la aplicación se perciba como un producto SaaS moderno hace falta un sistema de diseño unificado, modo oscuro, gráficos en el dashboard y patrones de feedback consistentes.

## What Changes

- Sistema de diseño con tokens propios en Tailwind v4 (`@theme`): color primario único (indigo), sombras/radios consistentes, tipografía system-ui y estados de foco visibles.
- Modo claro/oscuro con toggle persistido en `localStorage`, respetando la preferencia del sistema como valor inicial.
- Tres dependencias nuevas justificadas: `lucide-react` (iconos), `@headlessui/react` (Dialog/Switch/Transition accesibles) y `recharts` (donut de gastos por categoría).
- Primitivas reutilizables en `frontend/src/components/ui/`: Button, Input, Skeleton, EmptyState, ConfirmDialog y ToastProvider.
- Landing page pública en `/` (hero, features, CTA a registro/login) en lugar del placeholder actual.
- Login y registro rediseñados con los componentes del sistema.
- Shell responsive: sidebar colapsable a iconos en desktop y drawer con hamburguesa en mobile; toggle de tema en la sidebar.
- Dashboard con donut de gastos por categoría (recharts) además de totales, gastos por categoría y últimos movimientos existentes.
- Transacciones y presupuestos usan primitivas del sistema: toasts de resultado (éxito/error), diálogo de confirmación antes de eliminar, skeletons durante cargas y estados vacíos.
- Todos los textos visibles existentes se preservan exactamente (p. ej. `Agregar transacción`, `Presupuesto excedido`, `Limpiar filtros`); los textos nuevos (toasts, diálogos, landing, estados vacíos) quedan definidos en la spec `ui`.

## Capabilities

### New Capabilities
- `ui`: sistema de diseño consistente (tokens, tipografía, foco visible), modo claro/oscuro, landing pública, shell responsive con sidebar colapsable/drawer, toasts de feedback, confirmación de eliminación, skeletons, estados vacíos y donut de gastos por categoría en el dashboard.

### Modified Capabilities

## Impact

- **Código**: solo `frontend/`. Se modifican `index.css`, `AppLayout.jsx`, `HomePage.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`, `DashboardPage.jsx`, `AppPage.jsx`, `BudgetPage.jsx`, `main.jsx`; se agregan `components/ui/*` y `context/ThemeContext.jsx`. Backend y capa IA sin cambios.
- **Dependencias**: `lucide-react`, `@headlessui/react`, `recharts` (runtime de frontend).
- **API**: sin cambios.
- **Verificación**: lint + build de frontend; validación UI con docker compose en claro/oscuro, mobile y flujos completos con dos usuarios.
