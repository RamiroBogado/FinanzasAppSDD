# Tasks: ai-hybrid-deploy

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 330-380 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Hybrid proxy + Turso RO + docs, verified per layer | Single PR | `npm test` in `backend/` and `pytest -q` in `ai/` | Staging smoke: register → login → transactions → chatbot answer | Config-only: `AI_SERVICE_URL` back to local AI |

## Phase 1: Backend proxy hardening

- [x] 1.1 Add `aiTimeoutMs` from `AI_TIMEOUT_MS` (default 25000) in `backend/src/config.js`
- [x] 1.2 Enforce timeout via `AbortSignal` in `backend/src/routes/chat.js`, keep route/target/502 contract
- [x] 1.3 Extend `backend/test/chat.test.js`: auth forwarding, timeout → 502, invalid AI reply → 502
- [ ] 1.4 Verify backend: `npm test` in `backend/`

## Phase 2: AI Turso read-only

- [x] 2.1 Add pinned `libsql-experimental` to `ai/requirements.txt`
- [x] 2.2 Add `TURSO_*` read-only branch in `ai/app/data.py`, same 4 queries filtered by `user_id`, SQLite fallback
- [x] 2.3 Add `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` plus startup check in `ai/app/config.py`
- [x] 2.4 Create `ai/tests/test_data_turso.py`: parity vs SQLite fixtures, write rejection, `user_id` isolation
- [ ] 2.5 Verify AI: `pytest -q` in `ai/`

## Phase 3: Infra and docs

- [x] 3.1 Pass `TURSO_*` vars to ai service in `docker-compose.yml`
- [x] 3.2 Document `TURSO_*`, `AI_SERVICE_URL`, `AI_TIMEOUT_MS`, `DB_PATH` fallback in `.env.example`
- [x] 3.3 Document hybrid deploy, cold start, rollback in `README.md`

## Phase 4: Staging verification

- [ ] 4.1 Smoke E2E on staging: register → login → transactions → chatbot answers from Turso data
- [ ] 4.2 Verify isolation on staging: second user sees only own data; no frontend call outside `/api/*`
