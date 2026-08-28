# budgets Delta — validación opcional de category contra catálogo

## Added Requirement: Validación de categoría existente

Al crear o actualizar un presupuesto mediante `POST /api/budgets` o `PUT /api/budgets/:id`, si la petición incluye el campo opcional `category` (string no vacío), el sistema DEBE verificar que exista una categoría con ese nombre exacto (case-insensitive) en el catálogo del usuario autenticado (`categories.name` donde `categories.user_id = current_user.id` y `categories.type = 'expense'` — los presupuestos solo aplican a gastos). Si no existe, DEBE responder 400 con mensaje "La categoría no existe en tu catálogo". Si existe y es tipo `expense`, DEBE proceder normalmente.

El campo `category` sigue siendo opcional; si se omite o es string vacío, el presupuesto aplica a todos los gastos (comportamiento actual).

#### Scenario: Presupuesto con categoría válida de gasto
- **WHEN** el usuario autenticado crea presupuesto `{ "amount": 5000000, "period": "2026-08", "category": "Comida" }` existiendo "Comida" tipo expense en su catálogo
- **THEN** el sistema crea el presupuesto y responde 201 con categoría incluida

#### Scenario: Presupuesto con categoría inexistente
- **WHEN** el usuario autenticado crea presupuesto con `"category": "Inexistente"` no estando en su catálogo
- **THEN** el sistema responde 400 con mensaje "La categoría no existe en tu catálogo"

#### Scenario: Presupuesto con categoría de tipo income
- **WHEN** el usuario autenticado crea presupuesto con `"category": "Sueldo"` existiendo "Sueldo" tipo income en su catálogo
- **THEN** el sistema responde 400 con mensaje "La categoría no existe en tu catálogo o no es de tipo gasto"

#### Scenario: Presupuesto sin categoría (global)
- **WHEN** el usuario autenticado crea presupuesto sin campo `category` o con `""`
- **THEN** el sistema crea el presupuesto normalmente (aplica a todos los gastos)

#### Scenario: Categoría de otro usuario
- **WHEN** el usuario A crea presupuesto con `"category": "Comida"` donde "Comida" existe solo en catálogo del usuario B
- **THEN** el sistema responde 400 (no existe en catálogo de A)