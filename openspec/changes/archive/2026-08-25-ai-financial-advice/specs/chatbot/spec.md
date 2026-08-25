# chatbot Specification

## MODIFIED Requirements

### Requirement: Contexto limitado al usuario autenticado
El índice de recuperación DEBE construirse con transacciones, presupuestos y metas del usuario autenticado. Una consulta NUNCA DEBE recuperar información financiera perteneciente a otro usuario. Además de los datos financieros propios, el servicio PUEDE incluir documentos de conocimiento general del asistente financiero (consejos de presupuesto, ahorro, deudas, inversiones y fondo de emergencia) que NO DEBEN contener datos personales de ningún usuario.

#### Scenario: Datos de otro usuario excluidos
- **WHEN** dos usuarios autenticados preguntan por sus movimientos habiendo registrado datos distintos
- **THEN** cada respuesta se basa únicamente en los datos propios y ninguna respuesta incluye datos del otro usuario

#### Scenario: Consejos generales incluidos
- **WHEN** el usuario pregunta sobre un tema financiero general (presupuesto, ahorro, deudas) y existen documentos de conocimiento relevantes
- **THEN** la respuesta puede incluir orientación general basada en los documentos de conocimiento, sin mezclar datos de otros usuarios
