# Token-Locked Tests

## Status

- 2026-04-28: Planned and implemented the first pass for token-gated practice tests.

## Decision

- Locked tests are recorded in Supabase with one row per test: `test_id` and `token`.
- Public test list responses expose only `requiresToken`; they never expose the token string.
- Token verification happens through `/api/test-access`.
- Successful unlocks are stored per browser in `localStorage` with key prefix `ronan:test-access:v1`.
- The test room is client-gated before `TestEngine` renders so direct `/test/[id]` links still ask for access when the test is locked.

## Follow-Up Notes

- This design intentionally does not persist unlock state to a user database row.
- If tokens need to be rotated later and old local unlocks should expire, add a public lock version or updated timestamp to the lock metadata and include that in the localStorage value.

## Admin Management

- 2026-04-28: Added `/api/test-manager/locked-tests` for admins with `edit_public_exams`.
- The admin endpoint can list all published public tests with lock state, upsert a token lock, and delete a lock row.
- The management UI lives on `/test-manager/manage-tests` in a `Token Locks` workbook panel.
