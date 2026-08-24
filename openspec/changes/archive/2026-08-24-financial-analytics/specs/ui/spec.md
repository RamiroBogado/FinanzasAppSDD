# ui Specification

## MODIFIED Requirements

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

## ADDED Requirements

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
