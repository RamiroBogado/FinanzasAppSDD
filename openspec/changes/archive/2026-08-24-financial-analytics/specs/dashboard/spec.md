# dashboard Specification

## MODIFIED Requirements

### Requirement: Resumen de ingresos, gastos y saldo
El dashboard DEBE mostrar el total de ingresos, el total de gastos y el saldo calculados sobre las transacciones del usuario autenticado correspondientes al período seleccionado en el selector global (mes y año), con formato de moneda ARS (símbolo `$`, separador de miles y dos decimales). Al cambiar el período, los totales DEBEN recalcularse. Los datos del dashboard NUNCA DEBEN incluir transacciones de otros usuarios.

#### Scenario: Totales del dashboard
- **WHEN** el usuario autenticado visualiza el dashboard con transacciones propias del período seleccionado
- **THEN** el sistema muestra el total de ingresos, el total de gastos y el saldo con formato ARS calculados sobre las transacciones de ese mes

#### Scenario: Cambio de período
- **WHEN** el usuario autenticado cambia el mes o el año en el selector de período global
- **THEN** los totales del dashboard se recalculan sobre las transacciones del nuevo período

#### Scenario: Aislamiento del dashboard
- **WHEN** dos usuarios autenticados visualizan su dashboard con transacciones distintas
- **THEN** cada usuario ve únicamente los totales calculados sobre sus propias transacciones

### Requirement: Gastos por categoría en el dashboard
El dashboard DEBE mostrar el total de gastos de cada categoría del usuario autenticado correspondientes al período seleccionado en el selector global, con formato ARS.

#### Scenario: Gastos por categoría
- **WHEN** el usuario autenticado visualiza el dashboard con gastos categorizados propios del período seleccionado
- **THEN** el sistema muestra el total gastado de cada categoría presente en ese mes con formato ARS

## ADDED Requirements

### Requirement: Evolución mensual en el dashboard
El dashboard DEBE mostrar un gráfico de barras dobles con la evolución de los últimos 6 meses hasta el período seleccionado inclusive, representando los ingresos y los gastos de cada mes con colores semánticos consistentes (verde para ingresos, rojo para gastos) y montos con formato de moneda ARS. Si no hay movimientos en la ventana mostrada, DEBE presentarse un mensaje de vacío en español.

#### Scenario: Gráfico con datos
- **WHEN** el usuario autenticado visualiza el dashboard y tiene ingresos o gastos dentro de los últimos 6 meses hasta el período seleccionado
- **THEN** el sistema muestra el gráfico de evolución mensual con una barra de ingresos y una de gastos por mes y montos en formato ARS

#### Scenario: Ventana desplazada por el período
- **WHEN** el usuario autenticado selecciona un período anterior al mes actual
- **THEN** el gráfico muestra los últimos 6 meses contados desde el período seleccionado

#### Scenario: Sin movimientos en la ventana
- **WHEN** el usuario autenticado visualiza el gráfico de evolución sin movimientos en los últimos 6 meses
- **THEN** el sistema muestra un mensaje de vacío en español
