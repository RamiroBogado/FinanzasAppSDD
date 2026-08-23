# ui Specification

## MODIFIED Requirements

### Requirement: Sistema de diseño consistente
La interfaz DEBE utilizar la tipografía Inter Variable auto-hospedada como fuente de identidad en toda la aplicación, una paleta de marca única para controles y acentos, y tokens semánticos de color consistentes para montos y estados (verde para ingresos, rojo para gastos). Todos los montos DEBEN mostrarse con dígitos tabulares (`tabular-nums`) para alineación numérica perfecta en tablas y tarjetas. Los radios, sombras y espaciados DEBEN ser consistentes entre tarjetas, formularios y botones mediante tokens centralizados. Todo control interactivo DEBE mostrar un indicador de foco visible al navegar con teclado.

#### Scenario: Foco visible con teclado
- **WHEN** el usuario navega los controles de cualquier página utilizando la tecla Tab
- **THEN** cada control interactivo muestra un anillo o contorno de foco visible

#### Scenario: Montos alineados en columnas
- **WHEN** el usuario visualiza listados o tablas con varios montos
- **THEN** los dígitos se muestran tabulados y las unidades monetarias quedan alineadas verticalmente

### Requirement: Landing pública
La ruta `/` DEBE mostrar una landing pública del producto con el nombre `FinanzasApp`, un hero con llamado a la acción principal, una vista previa del producto, una grilla ampliada de funcionalidades principales y un footer. Los llamados a la acción `Crear cuenta` e `Iniciar sesión` DEBEN navegar a `/registro` y `/login` respectivamente.

#### Scenario: Acceso al registro desde la landing
- **WHEN** un visitante selecciona `Crear cuenta` en la landing
- **THEN** el sistema lo lleva a la página de registro

#### Scenario: Acceso al inicio de sesión desde la landing
- **WHEN** un visitante selecciona `Iniciar sesión` en la landing
- **THEN** el sistema lo lleva a la página de inicio de sesión

## ADDED Requirements

### Requirement: Autenticación split-screen
Las pantallas de inicio de sesión y registro DEBEN presentar un diseño dividido en dos paneles: uno lateral de marca con gradiente oscuro, logo, eslogan y beneficios del producto; y otro con el formulario correspondiente. En pantallas angostas DEBE mostrarse solo el formulario manteniendo la identidad visual. El comportamiento funcional de ambos formularios DEBE mantenerse sin cambios.

#### Scenario: Vista dividida en escritorio
- **WHEN** el visitante accede a `/login` o `/registro` en una pantalla ancha
- **THEN** ve el panel de marca junto al formulario correspondiente

#### Scenario: Formulario en pantalla angosta
- **WHEN** el visitante accede a `/login` o `/registro` desde una pantalla angosta
- **THEN** ve únicamente el formulario conservando los estilos de marca

### Requirement: KPI cards estilo fintech
El Dashboard DEBE mostrar tarjetas de indicadores clave con un chip circular de icono en color semántico por métrica, cubriendo ingresos, gastos, balance y ahorro acumulado en metas. Las tarjetas DEBEN mantener paridad entre modo claro y oscuro.

#### Scenario: Indicadores del dashboard
- **WHEN** el usuario autenticado ingresa al Dashboard con datos registrados
- **THEN** visualiza las cuatro tarjetas de indicadores con sus chips de icono semánticos y montos tabulados

#### Scenario: KPI cards en modo oscuro
- **WHEN** el usuario autenticado activa el modo oscuro en el Dashboard
- **THEN** las tarjetas de indicadores mantienen su jerarquía visual y legibilidad
