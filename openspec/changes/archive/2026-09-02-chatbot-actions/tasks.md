## 1. Especificación y persistencia

- [x] 1.1 Definir los contratos de propuesta, confirmación, cancelación y resultado para acciones del chatbot.
- [x] 1.2 Crear tablas e índices para solicitudes de acción y auditoría, incluyendo compatibilidad con bases existentes.

## 2. Backend

- [x] 2.1 Extraer validación y ejecución reutilizable de los recursos soportados.
- [x] 2.2 Implementar persistencia, vencimiento, cancelación e idempotencia de propuestas por usuario.
- [x] 2.3 Implementar confirmación autenticada para transacciones, categorías, presupuestos, metas, movimientos, alertas y exportaciones.
- [x] 2.4 Agregar pruebas de confirmación, cancelación, vencimiento, reintento, ambigüedad y aislamiento.
- [x] 2.5 Ejecutar `npm run lint` y `npm test` en `backend/`.

## 3. Servicio de IA

- [x] 3.1 Incorporar interpretación estructurada y conservadora de acciones sin acceso de escritura.
- [x] 3.2 Agregar pruebas de acciones completas, incompletas, ambiguas y consultas sin acción.
- [x] 3.3 Ejecutar `./.venv/Scripts/python.exe -m pytest -q` en `ai/`.

## 4. Frontend

- [x] 4.1 Agregar cliente API y tarjetas de propuesta con confirmación/cancelación al widget.
- [x] 4.2 Integrar resultados, navegación y descargas de exportación.
- [x] 4.3 Ejecutar `npm run lint` y `npm run build` en `frontend/`.

## 5. Validación integrada

- [x] 5.1 Verificar en UI una consulta, alta, edición, cancelación, eliminación, movimiento de meta, alerta y exportación.