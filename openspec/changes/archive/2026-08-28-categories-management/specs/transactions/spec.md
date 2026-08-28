# transactions Delta — validación opcional de category contra catálogo

## Added Requirement: Validación de categoría existente

Al crear o actualizar una transacción mediante `POST /api/transactions` o `PUT /api/transactions/:id`, si la petición incluye el campo opcional `category` (string no vacío), el sistema DEBE verificar que exista una categoría con ese nombre exacto (case-insensitive) en el catálogo del usuario autenticado (`categories.name` donde `categories.user_id = current_user.id`). Si no existe, DEBE responder 400 con mensaje "La categoría no existe en tu catálogo". Si existe, DEBE proceder normalmente.

El campo `category` sigue siendo opcional; si se omite o es string vacío, no se valida y se guarda como nulo.

#### Scenario: Transacción con categoría válida del catálogo
- **WHEN** el usuario autenticado crea transacción `{ "type": "expense", "amount": 150000, "date": "2026-08-27", "category": "Comida" }` existiendo "Comida" en su catálogo
- **THEN** el sistema crea la transacción y responde 201 con categoría incluida

#### Scenario: Transacción con categoría inexistente
- **WHEN** el usuario autenticado crea transacción con `"category": "Inexistente"` no estando en su catálogo
- **THEN** el sistema responde 400 con mensaje "La categoría no existe en tu catálogo"

#### Scenario: Transacción sin categoría
- **WHEN** el usuario autenticado crea transacción sin campo `category` o con `""`
- **THEN** el sistema crea la transacción normalmente (categoría nula)

#### Scenario: Categoría de otro usuario
- **WHEN** el usuario A crea transacción con `"category": "Comida"` donde "Comida" existe solo en catálogo del usuario B
- **THEN** el sistema responde 400 (no existe en catálogo de A)