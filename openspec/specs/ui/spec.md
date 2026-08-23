# ui Specification

## Purpose
Define el sistema de diseño de la interfaz: consistencia visual con tokens propios, modo claro/oscuro, landing pública, navegación responsive y patrones transversales de feedback (toasts, confirmación de eliminación, skeletons, estados vacíos) para que la aplicación se comporte como un producto SaaS moderno.

## Requirements

### Requirement: Sistema de diseño consistente
La interfaz DEBE utilizar la tipografía Inter Variable auto-hospedada como fuente de identidad en toda la aplicación, una paleta de marca única para controles y acentos, y tokens semánticos de color consistentes para montos y estados (verde para ingresos, rojo para gastos). Todos los montos DEBEN mostrarse con dígitos tabulares (`tabular-nums`) para alineación numérica perfecta en tablas y tarjetas. Los radios, sombras y espaciados DEBEN ser consistentes entre tarjetas, formularios y botones mediante tokens centralizados. Todo control interactivo DEBE mostrar un indicador de foco visible al navegar con teclado.

#### Scenario: Foco visible con teclado
- **WHEN** el usuario navega los controles de cualquier página utilizando la tecla Tab
- **THEN** cada control interactivo muestra un anillo o contorno de foco visible

#### Scenario: Montos alineados en columnas
- **WHEN** el usuario visualiza listados o tablas con varios montos
- **THEN** los dígitos se muestran tabulados y las unidades monetarias quedan alineadas verticalmente

### Requirement: Modo claro y oscuro
La interfaz DEBE ofrecer modo claro y modo oscuro mediante un toggle en la barra lateral del área autenticada. El sistema DEBE iniciar en la preferencia del sistema operativo si no existe elección guardada, y DEBE persistir la elección del usuario localmente para mantenerla entre sesiones.

#### Scenario: Alternar modo oscuro
- **WHEN** el usuario autenticado activa el toggle de tema en la barra lateral
- **THEN** la interfaz completa se muestra en modo oscuro

#### Scenario: Persistencia del tema
- **WHEN** el usuario cambia el tema y recarga la aplicación
- **THEN** la interfaz se muestra en el último tema elegido por el usuario

### Requirement: Landing pública
La ruta `/` DEBE mostrar una landing pública del producto con el nombre `FinanzasApp`, un hero con llamado a la acción principal, una vista previa del producto, una grilla ampliada de funcionalidades principales y un footer. Los llamados a la acción `Crear cuenta` e `Iniciar sesión` DEBEN navegar a `/registro` y `/login` respectivamente.

#### Scenario: Acceso al registro desde la landing
- **WHEN** un visitante selecciona `Crear cuenta` en la landing
- **THEN** el sistema lo lleva a la página de registro

#### Scenario: Acceso al inicio de sesión desde la landing
- **WHEN** un visitante selecciona `Iniciar sesión` en la landing
- **THEN** el sistema lo lleva a la página de inicio de sesión

### Requirement: Navegación responsive
El área autenticada DEBE mantener la barra lateral con los accesos `Dashboard`, `Transacciones` y `Presupuestos`, el username y `Cerrar sesión`. En escritorio la barra lateral DEBE poder colapsarse a solo iconos mediante un toggle propio, y en mobile DEBE ocultarse y accederse mediante un botón de menú que abre un panel desplegable superpuesto que se cierra al seleccionar un acceso.

#### Scenario: Panel desplegable en mobile
- **WHEN** el usuario autenticado visualiza la aplicación en una pantalla angosta y presiona el botón de menú
- **THEN** el sistema muestra la barra lateral como panel superpuesto y al seleccionar un acceso navega y cierra el panel

#### Scenario: Colapso de la barra lateral en escritorio
- **WHEN** el usuario autenticado activa el toggle de colapso en escritorio
- **THEN** la barra lateral se reduce a iconos manteniendo la navegación funcional

### Requirement: Feedback de operaciones con toasts
Las páginas de transacciones y presupuestos DEBEN informar el resultado de las operaciones de alta, edición y eliminación mediante toasts temporales. Las operaciones exitosas DEBEN mostrar respectivamente `Transacción agregada`, `Transacción actualizada`, `Transacción eliminada`, `Presupuesto creado`, `Presupuesto actualizado` o `Presupuesto eliminado`; las operaciones fallidas DEBEN mostrar el mensaje de error devuelto por la API en español.

#### Scenario: Toast de alta exitosa
- **WHEN** el usuario autenticado crea una transacción válida
- **THEN** el sistema muestra temporalmente el toast `Transacción agregada`

#### Scenario: Toast de error
- **WHEN** una operación sobre transacciones o presupuestos falla
- **THEN** el sistema muestra un toast temporal con el mensaje de error en español devuelto por la API

### Requirement: Confirmación antes de eliminar
Antes de eliminar una transacción o un presupuesto, el sistema DEBE mostrar un diálogo de confirmación con la pregunta `¿Eliminar esta transacción?` o `¿Eliminar este presupuesto?` y las acciones `Eliminar` y `Cancelar`. La eliminación SOLO DEBE ejecutarse al confirmar; al cancelar, el dato DEBE permanecer sin cambios.

#### Scenario: Eliminación confirmada
- **WHEN** el usuario autenticado confirma `Eliminar` en el diálogo de una transacción propia
- **THEN** el sistema elimina la transacción, actualiza el listado y muestra el toast correspondiente

#### Scenario: Eliminación cancelada
- **WHEN** el usuario autenticado selecciona `Cancelar` en el diálogo de confirmación
- **THEN** el sistema cierra el diálogo sin eliminar el dato

### Requirement: Estados de carga con skeletons
Mientras cargan los datos del dashboard, del listado de transacciones y del listado de presupuestos, la interfaz DEBE mostrar marcadores de posición animados en lugar de texto de carga.

#### Scenario: Carga inicial del dashboard
- **WHEN** el usuario autenticado ingresa al dashboard y los datos aún no llegaron
- **THEN** el sistema muestra skeletons animados en lugar del contenido hasta que los datos están disponibles

### Requirement: Estados vacíos
Cuando no hay datos para mostrar, el dashboard, el listado de transacciones y el listado de presupuestos DEBEN presentar un estado vacío con icono ilustrativo y mensaje en español, conservando los mensajes actuales: `Sin gastos categorizados`, `Sin movimientos`, `Aún no tenés transacciones`, `Sin resultados con los filtros actuales` y `Sin presupuestos para este mes`.

#### Scenario: Transacciones sin datos
- **WHEN** el usuario autenticado sin transacciones visualiza el listado
- **THEN** el sistema muestra un estado vacío con icono y el mensaje `Aún no tenés transacciones`

### Requirement: Gráfico de gastos por categoría
El dashboard DEBE mostrar además del listado de gastos por categoría un gráfico de torta tipo donut con la proporción de gasto de cada categoría y formato ARS en sus montos. Sin gastos categorizados, DEBE mostrarse únicamente el mensaje `Sin gastos categorizados`.

#### Scenario: Donut con datos categorizados
- **WHEN** el usuario autenticado tiene gastos con categorías y visualiza el dashboard
- **THEN** el sistema muestra el donut con una porción por categoría y montos en formato ARS

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
