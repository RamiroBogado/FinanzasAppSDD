\# FinanzasApp



\## Project



FinanzasApp es una aplicación de finanzas personales multiusuario.



El proyecto se desarrolla como un monorepo con tres capas:



\- `backend/`: API REST

\- `frontend/`: aplicación web

\- `ai/`: servicio de inteligencia artificial



\## Development Rules



\- Seguir `openspec/config.yaml` como fuente de reglas para el workflow spec-driven.

\- Los cambios de funcionalidades deben estar respaldados por un change activo de OpenSpec.

\- No implementar funcionalidades fuera del alcance del change activo.

\- No introducir tecnologías o dependencias sin justificar la decisión.

\- No realizar refactors no relacionados con el change activo.

\- Antes de implementar, inspeccionar el código y las specs existentes.

\- Mantener aislados los datos de cada usuario.

\- No exponer datos financieros de un usuario a otro usuario.

\- El servicio de IA debe respetar el mismo aislamiento de datos y autorización que el backend.

\- Ejecutar la verificación correspondiente a cada capa modificada antes de considerar terminado un change.

\- Los identificadores de código y commits deben estar en inglés.

\- Los textos visibles de la aplicación deben estar en español.

\- Los mensajes de error deben estar en español.

\- No agregar comentarios explicativos al código salvo que sean estrictamente necesarios.

