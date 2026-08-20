## Purpose

Constituye la vista principal del área autenticada: resume los ingresos, gastos, saldo, gastos por categoría y últimos movimientos del usuario para orientar su gestión diaria.

## ADDED Requirements

### Requirement: Resumen de ingresos, gastos y saldo
El dashboard DEBE mostrar el total de ingresos, el total de gastos y el saldo calculados sobre todas las transacciones del usuario autenticado, con formato de moneda ARS (símbolo `$`, separador de miles y dos decimales). Los datos del dashboard NUNCA DEBEN incluir transacciones de otros usuarios.

#### Scenario: Totales del dashboard
- **WHEN** el usuario autenticado visualiza el dashboard con transacciones propias
- **THEN** el sistema muestra el total de ingresos, el total de gastos y el saldo con formato ARS calculados sobre todas sus transacciones

#### Scenario: Aislamiento del dashboard
- **WHEN** dos usuarios autenticados visualizan su dashboard con transacciones distintas
- **THEN** cada usuario ve únicamente los totales calculados sobre sus propias transacciones

### Requirement: Gastos por categoría en el dashboard
El dashboard DEBE mostrar el total de gastos de cada categoría del usuario autenticado con formato ARS.

#### Scenario: Gastos por categoría
- **WHEN** el usuario autenticado visualiza el dashboard y tiene gastos con categorías
- **THEN** el sistema muestra el total gastado de cada categoría presente con formato ARS

### Requirement: Últimos movimientos en el dashboard
El dashboard DEBE mostrar los últimos movimientos del usuario autenticado ordenados por fecha descendente (hasta 10), con fecha en formato `dd/mm/aaaa`, monto con formato de moneda ARS y descripción o categoría.

#### Scenario: Últimos movimientos
- **WHEN** el usuario autenticado visualiza el dashboard y tiene transacciones
- **THEN** el sistema muestra sus transacciones más recientes con fecha en formato `dd/mm/aaaa` y monto en formato ARS

#### Scenario: Sin movimientos
- **WHEN** el usuario autenticado visualiza el dashboard sin transacciones
- **THEN** el sistema muestra un mensaje de vacío en español

### Requirement: Acceso al dashboard
El dashboard DEBE ser la vista principal del área autenticada, accesible desde la barra lateral con el acceso `Dashboard`. El dashboard DEBE mostrar el username del usuario autenticado en la barra lateral junto a `Cerrar sesión`. Sin sesión válida, el sistema DEBE redirigir al inicio de sesión.

#### Scenario: Acceso desde la navegación
- **WHEN** el usuario autenticado selecciona `Dashboard` en la barra lateral
- **THEN** el sistema muestra el dashboard con los datos del usuario autenticado

#### Scenario: Acceso sin sesión
- **WHEN** un usuario no autenticado intenta acceder al dashboard
- **THEN** el sistema lo redirige al inicio de sesión