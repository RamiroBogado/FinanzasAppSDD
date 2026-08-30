## Purpose

Habilita el modo WAL (Write-Ahead Logging) en SQLite para mejorar la concurrencia entre lecturas y escrituras, permitiendo lecturas concurrentes sin bloquear escrituras y viceversa.

## ADDED Requirements

### Requirement: Modo WAL activado al abrir la base de datos
Al inicializar la conexión SQLite, el sistema DEBE ejecutar `PRAGMA journal_mode=WAL` y `PRAGMA synchronous=NORMAL` antes de cualquier otra operación. El modo WAL DEBE persistir mientras la conexión esté abierta.

#### Scenario: Activación de WAL al iniciar
- **WHEN** el backend inicia y abre la conexión a `finanzas.db`
- **THEN** `PRAGMA journal_mode` retorna `wal` y `PRAGMA synchronous` retorna `1` (NORMAL)

### Requirement: Compatibilidad con tests en memoria
En entorno de test (`NODE_ENV=test` con base `:memory:`), el modo WAL NO DEBE activarse (SQLite en memoria no soporta WAL persistente).

#### Scenario: Tests usan memoria sin WAL
- **WHEN** `NODE_ENV=test` y la base es `:memory:`
- **THEN** no se ejecutan `PRAGMA journal_mode=WAL` ni `synchronous=NORMAL`

### Requirement: Verificación de modo activo
El sistema DEBE poder reportar el modo de journal actual via endpoint de health extendido.

#### Scenario: Health check reporta modo WAL
- **WHEN** se consulta `GET /health` extendido
- **THEN** la respuesta incluye `journal_mode: "wal"` (o `memory` en tests)