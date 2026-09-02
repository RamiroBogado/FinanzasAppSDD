# Design: chatbot-actions

## Context

El chat persiste mensajes por usuario y el backend reenvía la conversación al servicio de IA. Las rutas REST existentes ya aplican autenticación y validación para los recursos financieros. El modelo de IA no debe recibir autoridad para mutar la base de datos.

## Goals / Non-Goals

**Goals:**
- Permitir iniciar desde el chat las operaciones autenticadas ya implementadas.
- Exigir confirmación visible antes de cada mutación o eliminación.
- Mantener una única autoridad de negocio y aislamiento: el backend.

**Non-Goals:**
- Operaciones de autenticación, recuperación de contraseña o configuración no implementada.
- Ejecutar varias mutaciones en una misma confirmación.
- Dar al modelo acceso directo a SQLite o credenciales adicionales.

## Decisions

### D1. Propuesta antes de ejecución

La IA devuelve `reply` y, cuando detecta una instrucción accionable completa, una propuesta estructurada. El backend valida la forma permitida, la persiste asociada al `user_id` y devuelve un identificador opaco. El widget muestra el resumen y no ejecuta la operación hasta que se confirme.

### D2. Backend como ejecutor

`POST /api/chat/actions/:id/confirm` recupera exclusivamente una propuesta pendiente del usuario, verifica su vencimiento y la marca consumida antes de ejecutar. Reutiliza los servicios de dominio y las mismas validaciones de las rutas existentes. Así la IA no tiene acceso de escritura ni puede seleccionar recursos ajenos.

### D3. Acciones acotadas y resolubles

Una propuesta contiene un único verbo y datos normalizados. Para editar o eliminar exige un identificador propio resuelto por el backend; si hay cero o más de un candidato, el chat solicita aclaración. Las consultas pueden responderse con RAG o mediante enlaces de navegación; las exportaciones devuelven parámetros de descarga para que el navegador inicie el archivo.

### D4. Persistencia, vencimiento e idempotencia

`chat_action_requests` conserva el payload JSON, el estado (`pending`, `confirmed`, `cancelled`, `expired`), usuario y fechas. `chat_action_audit` conserva el resultado. La confirmación se procesa en una transacción y una propuesta ya confirmada devuelve su resultado registrado, sin repetir la mutación.

### D5. Frontend

El widget representa las propuestas como una tarjeta con `Confirmar` y `Cancelar`, bloquea doble envío y agrega al diálogo el resultado del backend. La exportación usa la función existente de descarga una vez confirmada.

## Risks / Trade-offs

- **[El modelo propone JSON malformado]** → El backend lo rechaza, no persiste una propuesta y el chat pide reformular.
- **[Acción ambigua o con datos insuficientes]** → No se emite propuesta; se solicita una aclaración.
- **[Doble clic o reintento HTTP]** → Estado consumido e idempotencia devuelven el resultado previo.
- **[Propuesta robada o vencida]** → Se filtra por `user_id`, vence y no puede ejecutarse.
- **[Duplicación de reglas de negocio]** → La capa de ejecución comparte validadores/servicios con las rutas REST existentes.
