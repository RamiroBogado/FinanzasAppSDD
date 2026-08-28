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
El área autenticada DEBE mantener la barra lateral con los accesos `Dashboard`, `Transacciones`, `Presupuestos` y `Alertas`, el username y `Cerrar sesión`. El acceso `Alertas` DEBE mostrar un badge con la cantidad de alertas no leídas cuando existan. La barra lateral DEBE incluir además el selector de período global (mes y año). En escritorio la barra lateral DEBE poder colapsarse a solo iconos mediante un toggle propio, y en mobile DEBE ocultarse y accederse mediante un botón de menú que abre un panel desplegable superpuesto que se cierra al seleccionar un acceso.

#### Scenario: Panel desplegable en mobile
- **WHEN** el usuario autenticado visualiza la aplicación en una pantalla angosta y presiona el botón de menú
- **THEN** el sistema muestra la barra lateral como panel superpuesto y al seleccionar un acceso navega y cierra el panel

#### Scenario: Colapso de la barra lateral en escritorio
- **WHEN** el usuario autenticado activa el toggle de colapso en escritorio
- **THEN** la barra lateral se reduce a iconos manteniendo la navegación funcional

#### Scenario: Badge de alertas no leídas
- **WHEN** el usuario autenticado tiene alertas no leídas y visualiza la barra lateral
- **THEN** el acceso `Alertas` muestra un badge con la cantidad de alertas no leídas

#### Scenario: Selector de período en la barra lateral
- **WHEN** el usuario autenticado visualiza la barra lateral en escritorio o en mobile
- **THEN** el selector de período global permanece visible y operativo

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

### Requirement: Selector de período global
La interfaz protegida DEBE ofrecer un selector de período global de mes y año en la barra lateral que DEBE persistir la elección localmente para mantenerla entre sesiones y DEBE iniciar en el mes y año actuales si no existe elección guardada. El selector DEBE gobernar los datos mostrados por Dashboard, Transacciones y Presupuestos.

#### Scenario: Persistencia del período
- **WHEN** el usuario autenticado cambia el período, cierra sesión o recarga la aplicación
- **THEN** la interfaz retoma el último período elegido por el usuario

#### Scenario: Período inicial
- **WHEN** un usuario autenticado sin elección guardada ingresa al área protegida
- **THEN** el selector muestra el mes y año actuales

#### Scenario: Cambio de período gobernado
- **WHEN** el usuario autenticado cambia el período en el selector global
- **THEN** Dashboard, Transacciones y Presupuestos actualizan sus datos al nuevo período

### Requirement: Colores consistentes por categoría
Cada categoría DEBE mostrarse con un color estable determinado a partir de su nombre, independiente del orden o la cantidad de categorías presentes, y DEBE ser el mismo en todas las visualizaciones donde aparezca (gráficos e indicadores). Los colores DEBEN mantener legibilidad y paridad entre modo claro y oscuro.

#### Scenario: Mismo color entre visualizaciones
- **WHEN** el usuario autenticado visualiza una misma categoría en el gráfico de distribución y en el listado de gastos por categoría del dashboard
- **THEN** la categoría aparece representada con el mismo color en ambas visualizaciones

#### Scenario: Estabilidad al agregar categorías
- **WHEN** el usuario autenticado registra transacciones con categorías nuevas y vuelve a visualizar el dashboard
- **THEN** las categorías previas conservan el color que ya tenían

### Requirement: Modal de creación y edición con fondo difuminado
La interfaz DEBE ofrecer los formularios de creación y edición de transacciones, presupuestos y metas de ahorro dentro de un modal centrado con fondo difuminado (`backdrop-blur`) idéntico al de categorías. Al presionar `Agregar transacción`, `Agregar presupuesto` o `Agregar meta`, el sistema DEBE abrir el modal con el formulario correspondiente y difuminar el fondo; al presionar `Cancelar`, confirmar el alta/edición, hacer click en el backdrop o presionar `ESC`, el sistema DEBE cerrar el modal y quitar el difuminado. Tanto la creación como la edición DEBEN usar el mismo modal con título dinámico (`Nueva ...` / `Editar ...`) y los mismos campos y validaciones que el formulario previo.

#### Scenario: Apertura del modal de transacción
- **WHEN** el usuario autenticado presiona `Agregar transacción` en la página Transacciones
- **THEN** el sistema abre un modal centrado con el formulario de transacción y muestra el fondo difuminado detrás

#### Scenario: Apertura del modal de presupuesto
- **WHEN** el usuario autenticado presiona `Agregar presupuesto` en la página Presupuestos
- **THEN** el sistema abre un modal centrado con el formulario de presupuesto y muestra el fondo difuminado detrás

#### Scenario: Apertura del modal de meta
- **WHEN** el usuario autenticado presiona `Agregar meta` en la página Metas
- **THEN** el sistema abre un modal centrado con el formulario de meta y muestra el fondo difuminado detrás

#### Scenario: Cierre del modal por Cancelar
- **WHEN** el usuario tiene abierto el modal de creación o edición y presiona `Cancelar`
- **THEN** el sistema cierra el modal y quita el fondo difuminado sin crear ni modificar datos

#### Scenario: Cierre del modal por backdrop o ESC
- **WHEN** el usuario tiene abierto el modal y hace click en el fondo difuminado o presiona `ESC`
- **THEN** el sistema cierra el modal y quita el fondo difuminado

#### Scenario: Edición también en modal
- **WHEN** el usuario autenticado presiona `Editar` sobre una transacción, presupuesto o meta existente
- **THEN** el sistema abre el mismo modal con los datos precargados y título `Editar ...` y fondo difuminado
