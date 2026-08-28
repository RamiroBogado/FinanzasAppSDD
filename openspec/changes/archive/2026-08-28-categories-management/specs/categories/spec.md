# categories Specification

## Purpose

Permite a cada usuario gestionar sus propias categorías de transacciones (crear, listar, actualizar, eliminar) con nombre único, tipo (ingreso/gasto) y color de paleta predefinida, manteniendo aislamiento total de datos entre usuarios.

## Requirements

### Requirement: Creación de categoría

El sistema DEBE permitir crear una categoría propia mediante `POST /api/categories` con token JWT válido. La petición DEBE incluir `name` (string 1-32 caracteres, requerido), `type` (`income` o `expense`, requerido) y `color` (hex string de la paleta predefinida de 10 colores, requerido). El sistema DEBE validar que el nombre no exista ya para el usuario (case-insensitive) y responder 400 con mensaje en español si falla la validación. En éxito DEBE responder 201 con los datos de la categoría creada (`id`, `name`, `type`, `color`, `created_at`).

#### Scenario: Alta exitosa de categoría Gasto
- **WHEN** el usuario autenticado envía `{ "name": "Comida", "type": "expense", "color": "#ef4444" }`
- **THEN** el sistema crea la categoría y responde 201 con sus datos

#### Scenario: Alta exitosa de categoría Ingreso
- **WHEN** el usuario autenticado envía `{ "name": "Sueldo", "type": "income", "color": "#10b981" }`
- **THEN** el sistema crea la categoría y responde 201 con sus datos

#### Scenario: Nombre duplicado (case-insensitive)
- **WHEN** el usuario autenticado intenta crear "comida" existiendo ya "Comida"
- **THEN** el sistema responde 400 con mensaje "Ya existe una categoría con ese nombre"

#### Scenario: Color fuera de paleta
- **WHEN** el usuario autenticado envía color `#ff0000` (no está en paleta de 10)
- **THEN** el sistema responde 400 con mensaje "Color no válido"

#### Scenario: Tipo inválido
- **WHEN** el usuario autenticado envía `type: "otro"`
- **THEN** el sistema responde 400 con mensaje "Tipo debe ser income o expense"

#### Scenario: Nombre vacío o muy largo
- **WHEN** el usuario autenticado envía `name: ""` o `name` de 33 caracteres
- **THEN** el sistema responde 400 con mensaje en español

### Requirement: Listado de categorías

El sistema DEBE permitir listar todas las categorías propias mediante `GET /api/categories` con token JWT válido. La respuesta DEBE ser un array ordenado alfabéticamente por `name` (case-insensitive), cada elemento con `id`, `name`, `type`, `color`, `created_at`.

#### Scenario: Listado vacío
- **WHEN** el usuario autenticado no tiene categorías
- **THEN** el sistema responde 200 con `[]`

#### Scenario: Listado con categorías
- **WHEN** el usuario autenticado tiene 3 categorías
- **THEN** el sistema responde 200 con array de 3 ordenado por nombre

#### Scenario: Aislamiento de datos
- **WHEN** el usuario A consulta `GET /api/categories`
- **THEN** el sistema NO devuelve categorías del usuario B

### Requirement: Actualización de categoría

El sistema DEBE permitir actualizar una categoría propia mediante `PUT /api/categories/:id` con token JWT válido. La petición DEBE incluir al menos uno de `name`, `type`, `color` (mismas validaciones que creación). El sistema DEBE verificar que la categoría pertenece al usuario autenticado (404 si no), validar unicidad de nombre case-insensitive excluyendo la propia categoría (400 si duplica), y responder 200 con datos actualizados.

#### Scenario: Renombrar categoría propia
- **WHEN** el usuario autenticado actualiza su categoría `id: "cat-1"` con `{ "name": "Alimentación" }`
- **THEN** el sistema responde 200 con nombre actualizado

#### Scenario: Intentar renombrar a nombre existente
- **WHEN** el usuario autenticado intenta poner "Comida" a una categoría distinta existiendo ya "Comida"
- **THEN** el sistema responde 400 con mensaje "Ya existe una categoría con ese nombre"

#### Scenario: Actualizar categoría ajena
- **WHEN** el usuario A intenta actualizar `id` de categoría del usuario B
- **THEN** el sistema responde 404

### Requirement: Eliminación de categoría

El sistema DEBE permitir eliminar una categoría propia mediante `DELETE /api/categories/:id` con token JWT válido. El sistema DEBE verificar que la categoría pertenece al usuario (404 si no). Si la categoría está referenciada en al menos una transacción (`transactions.category`) o presupuesto (`budgets.category`) del usuario, DEBE responder 409 con mensaje en español "No se puede eliminar: la categoría está en uso". En éxito DEBE responder 204 sin cuerpo.

#### Scenario: Eliminar categoría no usada
- **WHEN** el usuario autenticado elimina su categoría que no aparece en transacciones ni presupuestos
- **THEN** el sistema responde 204

#### Scenario: Eliminar categoría en uso en transacciones
- **WHEN** el usuario autenticado elimina su categoría "Comida" que tiene 3 transacciones
- **THEN** el sistema responde 409 con mensaje "No se puede eliminar: la categoría está en uso"

#### Scenario: Eliminar categoría en uso en presupuestos
- **WHEN** el usuario autenticado elimina su categoría "Comida" que tiene 1 presupuesto
- **THEN** el sistema responde 409 con mensaje "No se puede eliminar: la categoría está en uso"

#### Scenario: Eliminar categoría ajena
- **WHEN** el usuario A intenta eliminar categoría del usuario B
- **THEN** el sistema responde 404

### Requirement: Migración y seeder idempotente

Al aplicar la migración, el sistema DEBE crear la tabla `categories` si no existe. Para cada usuario existente, DEBE autocrear categorías a partir de los valores distintos de `transactions.category` y `budgets.category` no nulos/vacíos, inferiendo `type` por mayoría de `transactions.type` asociados (si empate, `expense`), y asignando color round-robin de la paleta de 10 colores. La operación DEBE ser idempotente (re-ejecutable sin duplicar).

#### Scenario: Usuario con transacciones y categorías variadas
- **WHEN** se ejecuta la migración para un usuario con transacciones categorías "Comida", "Transporte", "Sueldo"
- **THEN** se crean 3 categorías con tipos inferidos y colores asignados

## Constraints

- Paleta de 10 colores fija: `#6366f1`, `#8b5cf6`, `#a78bfa`, `#f59e0b`, `#ef4444`, `#10b981`, `#3b82f6`, `#ec4899`, `#14b8a6`, `#f97316`.
- Longitud máxima de nombre: 32 caracteres.
- Unicidad case-insensitive por usuario (`UNIQUE(user_id, lower(name))`).
- Todos los errores en español.
- Aislamiento estricto: cada endpoint filtra/verifica `user_id` del token JWT.