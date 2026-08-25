# ai-knowledge Specification

## Purpose

Proporciona al asistente financiero una base de conocimiento general de solo lectura con consejos sobre presupuesto, ahorro, deudas, inversiones y fondo de emergencia, indexada en una colección ChromaDB compartida entre todos los usuarios.

## ADDED Requirements

### Requirement: Base de conocimiento de solo lectura
El servicio DEBE mantener una colección ChromaDB compartida de solo lectura con documentos de conocimiento general cargados desde archivos markdown en el directorio de configuración. Los documentos DEBEN indexarse al iniciar el servicio y re-indexarse únicamente cuando cambien los archivos de origen, detectado mediante fingerprint SHA-256 del contenido concatenado. La colección DEBE mantenerse estrictamente separada de las colecciones de datos personales por usuario.

#### Scenario: Documentos indexados al iniciar
- **WHEN** el servicio de IA arranca con archivos markdown en el directorio de conocimiento
- **THEN** los documentos se indexan en la colección compartida y están disponibles para recuperación

#### Scenario: Re-indexado ante cambios
- **WHEN** el contenido de los archivos markdown cambia respecto del fingerprint persistido
- **THEN** la colección se reconstruye con el contenido vigente antes de la siguiente consulta

#### Scenario: Sin archivos de conocimiento
- **WHEN** el directorio de conocimiento está vacío o no existe
- **THEN** el servicio arranca sin errores y el retrieval de conocimiento devuelve una lista vacía

### Requirement: Retrieval combinado
El servicio DEBE recuperar documentos tanto del índice del usuario como del índice de conocimiento general, y combinarlos antes de enviarlos al modelo. La cantidad máxima de documentos de conocimiento DEBE ser configurable. Los documentos de conocimiento DEBEN marcarse con un prefijo visible para que el modelo los distinga de los datos del usuario.

#### Scenario: Pregunta financiera con consejo relevante
- **WHEN** el usuario pregunta sobre un tema para el que existe un consejo en la base de conocimiento
- **THEN** el prompt incluye tanto los documentos del usuario como los documentos de conocimiento relevantes, marcados con prefijo

#### Scenario: Pregunta sobre datos propios sin consejo relevante
- **WHEN** el usuario pregunta por un monto específico y no hay documentos de conocimiento relevantes
- **THEN** el prompt solo incluye los documentos del usuario sin documentos de conocimiento

### Requirement: Aislamiento del conocimiento general
Los documentos de conocimiento general NUNCA DEBEN contener datos financieros personales de ningún usuario. La colección de conocimiento DEBE ser de solo lectura para el servicio: los usuarios NUNCA DEBEN poder modificar, agregar ni eliminar documentos de conocimiento a través de la API.

#### Scenario: Datos personales ausentes en conocimiento
- **WHEN** se inspecciona la colección de conocimiento
- **THEN** no contiene ningún dato financiero, nombre, email o identificador de usuario
