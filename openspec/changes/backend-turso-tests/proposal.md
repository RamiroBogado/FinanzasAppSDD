# Proposal: backend-turso-tests

## Why

El backend migró a Turso (`getTursoClient().execute` async en todos los módulos) pero los 9 archivos de `backend/test/` siguen usando `getDatabase()` de better-sqlite3 sync contra otra base `:memory:`. La suite está en rojo: falla en importación porque `src/turso.js` exige `TURSO_DATABASE_URL`. Además hay split de doble base: la app escribe vía Turso y los tests limpian/assertan vía otra base, así que ni siquiera un bypass de env vars alcanzaría.

## What Changes

- Portar los 9 archivos de `backend/test/` al cliente Turso async contra base local de test, misma cobertura y mismos mensajes en español.
- `src/turso.js`: exigir `TURSO_AUTH_TOKEN` solo para URLs remotas (eximir `file:`), manteniendo el fail-closed para remoto.
- URL local de test vía env de vitest; cleanup entre tests con `DELETE FROM` vía cliente Turso.
- Fuera de alcance: cambios de producto, schema, migración Turso, frontend, ai.

## Capabilities

### Modified Capabilities

- `backend-tests`: la suite corre contra cliente Turso local async con paridad de cobertura; sin cambio de comportamiento de producto.

## Impact

- **backend** (Modificado): solo tests + regla de token para URLs `file:` en `turso.js`; sin cambio de schema.
- **frontend** (Sin cambios), **ai** (Sin cambios).
- **Schema SQLite**: sin cambios.

## Enfoque

Puerto mecánico 1:1 de assertions y fixtures al API async; un solo writer; verificación con `npm test` en verde local sin credenciales reales.

## Riesgos

| Riesgo | Prob. | Mitigación |
| Divergencia de semántica sync→async | Med | Misma cobertura, mismos casos |
| Estado compartido entre tests | Med | Cleanup explícito por archivo como hoy |
| Relajar regla de token | Low | Solo exime `file:`; remoto sigue fail-closed |

## Rollback Plan

Revertir los archivos de test y la regla de token; la app prod no cambia.

## Dependencias

- `@libsql/client` ya en `backend/package.json` + lock sincronizado.

## Criterios de éxito

- [ ] `npm test` en verde sin `TURSO_*` reales.
- [ ] Misma cantidad de casos y asserts que antes de la migración.
- [ ] Remoto sigue exigiendo `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
