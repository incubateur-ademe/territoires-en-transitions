---
title: "feat: Restore staging + preprod after daily backup, with data-rules scrubbing"
type: feat
status: active
date: 2026-04-28
deepened: 2026-04-28
---

# feat: Restore staging + preprod after daily backup, with data-rules scrubbing

## Overview

After the nightly production backup runs, automatically refresh **two** environments instead of one:

- **staging** is restored from the **freshest** backup (the one just produced today, UTC),
- **preprod** is restored from the **previous day's** backup (D-1).

The current `pgsync`-based nightly sync (`cd-sync.yml`, `cd-sync-preprod.yml`) is retired in favor of this restore flow, and `pgsync` artifacts in the repo are removed. The `data_rules` block previously inside `.pgsync.yml` is preserved as the source of truth for sensitive-column scrubbing, but it now drives a **post-restore SQL scrubber** that runs inline inside `restore.sh` against every restored target (staging, preprod, and any local or manual restore) — replacing the implicit anonymization that pgsync used to do during sync. The config file itself moves from `data_layer/pgsync/.pgsync.yml` to `data_layer/backup/restore-config.yml`, dropping the tool-bound name now that pgsync is gone.

---

## Problem Frame

Two needs converge in this work:

1. **Operational simplicity.** We currently maintain two parallel mechanisms to refresh non-prod databases from prod: the `pgsync` nightly job (staging) and the `validate-restore` step inside the backup workflow (preprod). The latter is now demonstrably reliable — it has been green for 10 consecutive nights as of 2026-04-28 — and is ready to be the single mechanism. Keeping both costs maintenance time and confuses the mental model — "how does staging get its data?" should have one answer.
2. **Data safety.** The pgsync flow had a built-in `data_rules` mechanism that scrubbed sensitive columns (passwords, phone numbers). Removing pgsync without replacing this scrubbing would leak production credentials into staging/preprod, which is unacceptable. The replacement reads the same `data_rules` block so the policy lives in one place.

### Why staging-fresh + preprod-D-1?

The temporal asymmetry between staging and preprod is intentional and serves a concrete debugging use case:

- **staging** is restored from the freshest backup (the one produced minutes earlier, at ~22:00 UTC). For devs and QA arriving the next morning, staging contains data that lags prod by roughly 8-14 hours. They get a near-current view of prod for testing and reproducing recent activity.
- **preprod** is restored from D-1. This makes it easy to check the state of the DB one day ago for debugging — "what did prod look like 24 hours back?" — without having to manually retrieve and restore an older backup. Preprod becomes a permanent, always-available "yesterday" reference.

When devs/QA need fresher data than the nightly delivers, the manual `cd-restore-preprod.yml` workflow remains available as an escape hatch (it can target any backup date the operator chooses).

---

## Requirements Trace

- R1. After the nightly `backup-production` job succeeds, **staging** is restored from `backup-<today-UTC>.dump`.
- R2. After the nightly `backup-production` job succeeds, **preprod** is restored from `backup-<yesterday-UTC>.dump` (D-1, computed inside the post-backup job and relative to the UTC date when `backup-production` finished).
- R3. Both restores use the same `restore.sh` entrypoint as today (no logic duplication between staging/preprod paths).
- R4. After every successful restore (staging, preprod, local, manual `cd-restore-preprod.yml`), a **post-restore scrubber** runs inline inside `restore.sh` and applies the `data_rules` block from `restore-config.yml` to the target database. The scrubber supports two rule shapes: `null` (set the column to NULL) and `{value: ...}` (set to a literal or env-var-resolved value). Bare scalars and any other shape fail loudly. The current rules in scope are `phone: null`, `telephone: null`, and `encrypted_password: {value: env: RESTORE_ENCRYPTED_PASSWORD, skip_if_unset: true}`.
- R5. The scrubber operates over a **hard-coded table allowlist** in `restore.sh` — currently `auth.users` and `public.dcp` — applying any rule whose key matches a column in those tables. Adding new PII tables requires a code change (deliberate choice: data scope is a code-review gate). Adding new rules to existing allowlisted tables requires only a YAML edit.
- R6. The pgsync sync workflows (`cd-sync.yml`, `cd-sync-preprod.yml`), pgsync sync scripts, the pgsync `README.md`, and the `db-sync*` Earthfile targets are removed from the repo.
- R7. `.pgsync.yml` is moved and renamed to `data_layer/backup/restore-config.yml`. It remains the single source of truth for both the table/group definitions used by `restore.sh` and the `data_rules` consumed by the scrubber. The `PGSYNC_YML` variable in `restore.sh` is renamed accordingly.
- R8. The production-protection guard in `restore.sh` is converted from a denylist (single hardcoded prod project ID) to an **allowlist** of known staging/preprod project IDs, plus localhost-shape URLs for local dev.
- R9. The existing `BACKUP_RESTORE_TO_DB_URL` secret is retired in favor of reusing the existing `STAGING_DB_URL` and `PREPROD_DB_URL` secrets (already proven by the pgsync workflows). `cd-restore-preprod.yml` is updated to use `PREPROD_DB_URL`.
- R10. ADR 0016 and other docs are updated to reflect the new file layout, the disappearance of the pgsync sync, the new scrubber step, and the secret consolidation.

---

## Scope Boundaries

- **Not** changing the backup mechanism itself (`backup.sh`, S3 layout, retention policy in `cleanup.sh`, metadata file format) — only what runs after backup.
- **Not** changing the manual restore workflow (`cd-restore-preprod.yml`) input contract — the date input still works as today; it inherits the new scrubbing step and switches to `PREPROD_DB_URL`.
- **Not** introducing new scrubbing rule types beyond the two used today (literal `{value: ...}` and `null`). Generators (`random_string`, `unique_email`, etc.) are explicitly out of scope; the scrubber fails loudly on unknown rule shapes rather than silently no-op.
- **Not** changing how local devs run a restore — `./restore.sh latest` continues to work.
- **Not** expanding scrubbing to other PII columns in this iteration. `auth.users.email`, `auth.users.raw_user_meta_data`, `public.dcp.email`, `public.dcp.nom`, `public.dcp.prenom` are left as production data. (Discussed during planning and explicitly accepted by the requester. May be revisited.)

### Capabilities being retired with pgsync

Removing pgsync forecloses several capabilities. None are currently in use by the team; documenting the loss so it is visible:

- **Partial-table sync** (sync only one table for a debug session): replaced by the manual `cd-restore-preprod.yml` workflow + manual SQL on the target if a finer-grained refresh is needed.
- **Selective row sync** (`pgsync --where`): no replacement; was never used in the current workflows.
- **Live-source sync without going through S3**: no replacement; the new flow always passes through S3, which is intentional (verifies the backup roundtrip).
- **Incremental refresh**: no replacement; restore is full-table by design.

### Deferred to Follow-Up Work

- Adding pgTAP or bash unit tests for the scrubber: a follow-up if test churn is observed; this plan relies on inline sanity assertions and CI smoke verification.
- Expanding PII scrubbing scope to names, emails, and `raw_user_meta_data`: deliberately out of scope (see Scope Boundaries). May be revisited as a separate plan.

---

## Context & Research

### Relevant Code and Patterns

- [data_layer/backup/restore.sh](data_layer/backup/restore.sh) — already parses `.pgsync.yml` with `yq` (line 140), already runs a post-restore SQL step (`reset_sequences.sql` at line 330), already does sanity checks on key tables (line 338). The scrubber slots in immediately after `reset_sequences.sql` and before sanity checks. The Supabase `auth.users → public.dcp` trigger interaction is already handled in restore.sh (lines 256-258 re-truncate `dcp` before its own restore).
- [data_layer/backup/reset_sequences.sql](data_layer/backup/reset_sequences.sql) — pure SQL `do $$ ... $$` block invoked via `psql -d "$TO_DB_URL" -f`. Pattern to mirror for the scrubber's SQL portion if templating becomes preferable to inline `psql -c`.
- [data_layer/sqitch/deploy/utilisateur/dcp.sql](data_layer/sqitch/deploy/utilisateur/dcp.sql) (and the `sync_dcp` trigger function) — confirms the `coalesce(new.phone, telephone)` semantics that drive the dcp.telephone scrub design (see Implementation Units / U2 / Trigger interaction).
- [.github/workflows/backup-database.yml](.github/workflows/backup-database.yml) — has a `backup-production` job followed by a `validate-restore` job that depends on it via `needs:`. The new layout extends this: two restore jobs in parallel after backup, each with its own concurrency group.
- [.github/workflows/cd-restore-preprod.yml](.github/workflows/cd-restore-preprod.yml) — manual restore workflow; updated to use `PREPROD_DB_URL`.
- [.github/workflows/cd-sync.yml](.github/workflows/cd-sync.yml) and [cd-sync-preprod.yml](.github/workflows/cd-sync-preprod.yml) — the pgsync workflows being retired.
- [data_layer/pgsync/.pgsync.yml](data_layer/pgsync/.pgsync.yml) — the file to move, rename, and refactor (data_rules format extended for `dcp.telephone` and env-var bcrypt resolution).
- [Earthfile](Earthfile) — `db-sync-build`, `db-sync`, `db-sync-local` targets to delete (search for the target names; line numbers may shift).

### Institutional Learnings

- No prior `doc/solutions/` entry covers backup/restore or pgsync — `doc/solutions/` is currently focused on parallel-e2e isolation, history-repository extraction, and a Drizzle race condition. Clean slate for this work.
- ADR 0016 (`doc/adr/0016-strategie-backup-database.md`) is the institutional reference for the existing backup/restore architecture and explains the Supabase-specific constraints (auth/storage tables not owned by us, `--disable-triggers` impossible, `auth.users → dcp` trigger). Those constraints continue to apply: the application role behind `STAGING_DB_URL` / `PREPROD_DB_URL` already has the DML rights `restore.sh` needs (since pgsync used those credentials successfully).

### External References

- pgsync `data_rules` documentation (https://github.com/ankane/pgsync#data-rules) — confirms the YAML shapes: scalar literal, `{value: ...}`, `null`. The plan supports only the two shapes in actual use, not the broader pgsync surface.

---

## Key Technical Decisions

- **Scrubber inlined in `restore.sh`, no separate script.** The scrubber is two-to-three UPDATE statements driven by a small YAML loop. A separate `apply_data_rules.sh` would be ceremony without payoff and would force duplicating the production-allowlist guard. Inlining keeps the safety invariant local to the only call site and follows the same pattern as the existing `reset_sequences.sql` invocation.
- **Hard-coded table allowlist (`auth.users`, `public.dcp`) inside `restore.sh`.** Replaces the originally-considered dynamic `information_schema` scan. Adding new PII tables now requires a code change, which is a deliberate code-review gate against accidental scope creep (a future migration adding a `phone` column to a business table will not silently get its data wiped). Adding new rules to *existing* allowlisted tables remains a YAML-only change.
- **Two rule shapes only: `null` and `{value: ...}`.** Bare scalars and any other shape fail loudly. Matches what `data_rules` actually contains today.
- **`{value: ...}` supports env-var resolution.** A rule of the form `{value: {env: X, skip_if_unset: true}}` reads `$X` from the environment; if `$X` is unset, the rule is skipped (the column is left untouched). This is how `encrypted_password` is now configured, with the bcrypt hash held in a GitHub Actions secret (`RESTORE_ENCRYPTED_PASSWORD`) instead of committed to the repo.
- **Scrubber uses `psql -v` variable substitution.** Avoids both shell expansion (`$2`, `$10` in bcrypt hashes) and SQL injection. `psql -v hash="$RESTORE_ENCRYPTED_PASSWORD"` + SQL `:'hash'` substitution is opaque to both layers.
- **Per-statement autocommit, not a wrapping transaction.** Cross-schema UPDATEs from a non-owner role on Supabase have unverified transactional semantics; idempotent UPDATE-to-constant statements are equally safe per-statement and avoid the lock/RLS interaction risk.
- **Scrubber log lines redact rule values.** Even with the GitHub Actions secret auto-redaction, log lines that reference the configured value redact explicitly (`***`). Post-scrub assertion logs report pass/fail counts, never the expected value.
- **No `SKIP_DATA_RULES` opt-out.** Wasn't in the user request and would create governance and scoping problems (CI bypass, remote-target leakage). Safety is the only path; if a concrete need for an escape hatch emerges, it gets designed properly in a follow-up.
- **Sequence ordering binding: `restore data → reset_sequences.sql → scrubber → sanity checks`.** The scrubber doesn't insert rows so it can't disturb the sequence resets, and the sanity checks run last to verify both. Documented as fixed in `restore.sh`.
- **Two parallel restore jobs (`restore-staging`, `restore-preprod`) rather than one matrix job.** Each needs its own concurrency group (separate target DBs), each may diverge later (per-environment sanity checks), and parallelism keeps wall-clock time flat. Each job carries a 90-minute timeout.
- **Date computation in the workflow, not in `restore.sh`.** `restore.sh`'s "no-arg = today" semantics is load-bearing for local use. The workflow passes `latest` for staging and an explicit `YYYY-MM-DD` (D-1) for preprod, computed via GNU `date -u -d 'yesterday'` inside the post-backup job. `restore.sh` stays portable to BSD `date` on macOS.
- **Reuse `STAGING_DB_URL` and `PREPROD_DB_URL`; retire `BACKUP_RESTORE_TO_DB_URL`.** Both secrets already exist, were used by pgsync, and have the right privileges by construction. Consolidating to one secret per environment removes a category of "which secret again?" confusion.
- **Production guard converted from denylist to allowlist.** `restore.sh` refuses to run unless `TO_DB_URL` matches one of: known staging Supabase project ID, known preprod Supabase project ID, or a localhost-shaped URL. Allowlists fail closed; adding a second prod project later doesn't quietly bypass the guard.
- **File renamed from `.pgsync.yml` to `restore-config.yml`.** With pgsync gone, the tool-bound filename is misleading.
- **Use `latest` instead of `<today>` for staging.** Robust to clock skew or partial S3 propagation; matches conventions already supported by `restore.sh`.

---

## Open Questions

### Resolved During Planning

- **Which backup goes to which environment?** Resolved with the user: staging = freshest (today's), preprod = D-1.
- **Where do the rules apply?** Resolved: hard-coded table allowlist (`auth.users`, `public.dcp`) inside `restore.sh`. Column-name match within those tables.
- **Opt-in vs opt-out for the scrubber?** Resolved: no opt-out; scrubber always runs.
- **Is `validate-restore` actually running today?** Resolved: yes — the job has been green for 10 consecutive nights as of 2026-04-28. The new dual-restore inherits a verified foundation, not an assumption.
- **Sequence of post-restore steps?** Resolved binding: `restore data → reset_sequences.sql → scrubber → sanity checks`.
- **YAML-to-SQL value escaping?** Resolved: `psql -v variable=value` substitution with `:'name'` SQL form. Avoids shell and SQL expansion footguns.
- **bcrypt hash storage?** Resolved: held in a GitHub Actions secret `RESTORE_ENCRYPTED_PASSWORD`; the YAML rule references it via `{value: {env: RESTORE_ENCRYPTED_PASSWORD, skip_if_unset: true}}`. If the env var is unset (e.g., local dev without it set), the encrypted_password rule is skipped.
- **Which secret for staging?** Resolved: reuse `STAGING_DB_URL`. For preprod: reuse `PREPROD_DB_URL`. `BACKUP_RESTORE_TO_DB_URL` is retired.

### Deferred to Implementation

- **Concurrency-group naming for staging.** Almost certainly `restore-staging` (mirroring the existing `restore-preprod`); codify during implementation.
- **Whether the scrubber's allowlist guard duplication (R8 allowlist) is one shared shell function or two inline checks.** Cosmetic; pick during implementation.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Post-backup orchestration shape

```mermaid
flowchart LR
  A[backup-production<br/>22:00 UTC] --> B[restore-staging<br/>arg: latest<br/>STAGING_DB_URL]
  A --> C[restore-preprod<br/>arg: D-1 YYYY-MM-DD<br/>PREPROD_DB_URL]
  A --> D[cleanup-old-backups<br/>retention policy]
  B --> B1[restore.sh]
  C --> C1[restore.sh]
  B1 --> E1[reset_sequences.sql]
  C1 --> E2[reset_sequences.sql]
  E1 --> F1[inline scrubber]
  E2 --> F2[inline scrubber]
  F1 --> G1[sanity checks]
  F2 --> G2[sanity checks]
```

### `restore-config.yml` shape (the moved/renamed file)

```yaml
# Top section unchanged from .pgsync.yml — table groups consumed by restore.sh
groups:
  technical_group:
    - evaluation.service_configuration
    # ...

# Bottom section: scrubber rules applied inline by restore.sh
data_rules:
  phone: null
  telephone: null
  encrypted_password:
    value:
      env: RESTORE_ENCRYPTED_PASSWORD
      skip_if_unset: true
```

### Inline scrubber resolution (pseudo-code)

```
SCRUB_TABLES=(
  "auth.users"
  "public.dcp"
)

for each (column_name, rule) in yq '.data_rules' restore-config.yml:
    sql_value = resolve_rule(rule)
    if sql_value is SKIP:
        log "skipped column_name (env not set)"
        continue
    for (schema, table) in SCRUB_TABLES:
        if column_exists(schema, table, column_name):
            psql -v val="$sql_value" -c "UPDATE schema.table SET column_name = :'val';"
            # ...or NULL form when sql_value is NULL_LITERAL

resolve_rule(rule):
    if rule is null              -> NULL_LITERAL
    if rule is {value: scalar}   -> quote_literal(scalar)
    if rule is {value: {env: X, skip_if_unset: true}}:
        if $X is unset           -> SKIP
        else                     -> quote_literal($X)
    else                         -> error "unsupported rule shape: rule_key"
```

### Trigger interaction (auth.users → public.dcp)

`restore.sh`'s GROUP_ORDER is `technical_group → stats_group → collectivites_group → indicateurs_group → referentiels_group → pai_group → plans_group`. So:

1. `auth.users` is restored first (in `technical_group`). Its restore fires the Supabase `sync_dcp` INSERT trigger, populating `public.dcp` from prod data.
2. `public.dcp` is restored later (in `collectivites_group`). The existing `restore.sh` re-truncates `dcp` immediately before its own restore (lines 256-258) to clear the trigger output, then restores `dcp` from the dump.
3. After the table-by-table restore completes, `reset_sequences.sql` runs.
4. The inline scrubber runs. It UPDATEs `auth.users.phone = NULL` and `auth.users.encrypted_password = $RESTORE_ENCRYPTED_PASSWORD` (or skips the password rule if the env var is unset). The UPDATE on `auth.users` fires the `sync_dcp` UPDATE trigger, which uses `coalesce(new.phone, telephone)` — meaning **`dcp.telephone` keeps its existing value** because `coalesce(NULL, telephone) = telephone`. Real prod phone numbers would survive.
5. To prevent this leak, the scrubber explicitly applies `telephone: null` to `public.dcp` (the SCRUB_TABLES allowlist contains `public.dcp`, and `data_rules` includes a `telephone: null` rule). After this step, `dcp.telephone` is NULL.
6. Sanity checks run (curated PII checklist — see Implementation Units / U2).

---

## Implementation Units

- U1. **Move and rename config file; update `restore.sh`**

**Goal:** Relocate the YAML to `data_layer/backup/`, drop the tool-bound name, update the consumer.

**Requirements:** R7

**Dependencies:** None

**Files:**
- Modify (move + rename): `data_layer/pgsync/.pgsync.yml` → `data_layer/backup/restore-config.yml`
- Modify: `data_layer/backup/restore.sh` (path + variable rename)

**Approach:**
- `git mv data_layer/pgsync/.pgsync.yml data_layer/backup/restore-config.yml`
- In `restore.sh`, change `PGSYNC_YML="$SCRIPT_DIR/../pgsync/.pgsync.yml"` to `RESTORE_CONFIG="$SCRIPT_DIR/restore-config.yml"`. Replace all `PGSYNC_YML` references with `RESTORE_CONFIG`. Update the comment at line 138 (`# --- Parse .pgsync.yml ...`) to match.
- Verify: `git grep '\.pgsync\.yml'` returns only doc references (handled in U6) and the deleted Earthfile/workflow files (handled in U5).

**Patterns to follow:**
- Keep the existing `SCRIPT_DIR` derivation in `restore.sh` (line 139).

**Test scenarios:**
- Happy path: `bash data_layer/backup/restore.sh <local-test-dump>` against a local DB still finds tables and restores them. Verify by running locally and seeing the same group/table iteration output as before.
- Edge case: Removing `restore-config.yml` reproduces the existing "config not found" error message at the new path (current logic at lines 142-145 unchanged in shape).

**Verification:**
- `restore.sh` runs end-to-end against a local test dump with the new path.
- `git grep '\.pgsync\.yml'` finds nothing in code; remaining matches are in docs handled by U6.

---

- U2. **Inline `data_rules` scrubber in `restore.sh`**

**Goal:** After `reset_sequences.sql` runs, scrub the allowlisted tables according to `data_rules`. Replace pgsync's anonymization without introducing a separate script.

**Requirements:** R4, R5, R7 (extended `data_rules` shape)

**Dependencies:** U1

**Files:**
- Modify: `data_layer/backup/restore.sh` (add scrubber section after `reset_sequences.sql`, before sanity checks; revise sanity check)
- Modify: `data_layer/backup/restore-config.yml` (extend `data_rules` to include `telephone: null` and the env-var resolution form for `encrypted_password`)

**Approach:**
- Hard-code `SCRUB_TABLES=("auth.users" "public.dcp")` in `restore.sh`.
- Read `data_rules` from `restore-config.yml` via `yq`.
- For each `(column_name, rule)` pair:
  - Resolve the rule shape (see High-Level Technical Design / resolve_rule pseudo-code).
  - Loop over SCRUB_TABLES; for each `(schema, table)`, check `information_schema.columns` (scoped to the specific table — not a global scan) to see if the column exists.
  - If yes, run `psql -v val="$resolved" -c "UPDATE schema.table SET column_name = :'val';"` (or the NULL form when applicable).
  - If `resolved` is the SKIP sentinel (env var unset for that rule), log `skipped <column_name> (env <X> not set)` and continue without touching that column.
- Per-statement autocommit (no wrapping transaction).
- All log lines that reference values redact (`***`); the post-scrub assertion logs only pass/fail counts.
- Replace the existing per-rule sanity assertion with a curated PII checklist:
  - `SELECT count(*) FROM auth.users WHERE phone IS NOT NULL` must be 0.
  - `SELECT count(*) FROM public.dcp WHERE telephone IS NOT NULL` must be 0.
  - `SELECT count(*) FROM auth.users WHERE encrypted_password != current_setting('rest.expected_pwd', true)` must be 0 — OR the assertion is skipped for `encrypted_password` when the env var was unset (matching the rule's skip-if-unset behavior).
- Existing `restore.sh` line 256-258 dcp re-truncate stays as-is — it cleans up the trigger output during the restore phase. The scrubber's `dcp.telephone` UPDATE happens after that, on the now-restored real dcp data.

**Trigger interaction (load-bearing reasoning):** see High-Level Technical Design / Trigger interaction. The sequence is: auth.users restored (technical_group, first) → trigger populates dcp from prod → dcp re-truncated and restored (collectivites_group) → reset_sequences → scrubber UPDATEs auth.users (trigger fires UPDATE path; COALESCE preserves dcp.telephone) → scrubber UPDATEs public.dcp.telephone explicitly (clears the leak). The `telephone: null` rule + dcp in SCRUB_TABLES is what closes the loophole.

**Patterns to follow:**
- `reset_sequences.sql` invocation pattern in `restore.sh` lines 327-331 — mirror for the new step (announce, run, confirm).
- Existing `yq -r ".groups.$group[]"` parsing in `restore.sh` lines 180, 216 — reuse the parsing style for `.data_rules`.

**Test scenarios:**
- Happy path (null rule): A test DB with `auth.users` rows holding real-looking phone numbers and `public.dcp` rows holding telephone values. After scrubber: `count(*) WHERE phone IS NOT NULL = 0` on `auth.users`; `count(*) WHERE telephone IS NOT NULL = 0` on `public.dcp`.
- Happy path (value rule with env): `RESTORE_ENCRYPTED_PASSWORD=$2a$10$...` set in env. After scrubber: every `auth.users.encrypted_password` equals the configured hash.
- Happy path (value rule with env unset): `RESTORE_ENCRYPTED_PASSWORD` not set. The rule is skipped; `auth.users.encrypted_password` retains its restored value. Log line confirms skip.
- Edge case: `data_rules` block missing from `restore-config.yml` → script logs "no data rules configured" and exits 0 cleanly.
- Edge case: `data_rules` includes a rule key for a column that doesn't exist in any SCRUB_TABLES entry (e.g., a stale `email_change: null`) → no UPDATE issued; log line indicates 0 tables matched.
- Edge case: A rule applies to multiple tables (e.g., `phone` rule matches `auth.users.phone`; not `public.dcp.phone` because that doesn't exist; both queried correctly).
- Error path: Unsupported rule shape (e.g., `phone: { random: true }`) → script exits non-zero with a clear error naming the rule key.
- Error path: `yq` not installed → same failure mode as `restore.sh` line 147-152 (clear error with install hint).
- Error path: `psql` connection fails on a SCRUB_TABLES UPDATE → set -e propagates; restore job fails with a clear stderr message.
- Error path: bcrypt-hash value contains `$` characters; `psql -v` substitution preserves the literal (not corrupted by shell or SQL expansion). Verify by setting `RESTORE_ENCRYPTED_PASSWORD='$2a$10$xxx'` and confirming the resulting `encrypted_password` matches byte-for-byte.
- Integration: Full `restore.sh` run against a local DB applies the scrubber after `reset_sequences.sql`; final state shows scrubbed phone/telephone columns AND correct sequence positions; sanity checks pass.
- Integration: Production-protection allowlist (U4) blocks the scrubber path: invoking `restore.sh` against a non-allowlisted URL exits at the new guard before any restore or scrub happens.

**Verification:**
- Local restore against a seeded DB shows the scrubber log block with per-table updated row counts (values redacted in any log lines).
- Curated PII assertion passes: `phone IS NOT NULL` count is 0 on `auth.users`; `telephone IS NOT NULL` count is 0 on `public.dcp`.

---

- U3. **Restructure `backup-database.yml`: parallel staging + preprod restore jobs; update `cd-restore-preprod.yml` secret**

**Goal:** After the nightly backup, restore staging from the freshest backup (using `STAGING_DB_URL`) and preprod from D-1 (using `PREPROD_DB_URL`), in parallel. Update the manual preprod-restore workflow to use the consolidated secret.

**Requirements:** R1, R2, R3, R9

**Dependencies:** U1, U2, U4

**Files:**
- Modify: `.github/workflows/backup-database.yml`
- Modify: `.github/workflows/cd-restore-preprod.yml`

**Approach:**
- Replace the existing `validate-restore` job in `backup-database.yml` with two jobs (`restore-staging`, `restore-preprod`) that both `needs: [backup-production]`.
- `restore-staging`:
  - `concurrency: group: restore-staging`
  - `timeout-minutes: 90`
  - `TO_DB_URL: ${{ secrets.STAGING_DB_URL }}`
  - `RESTORE_ENCRYPTED_PASSWORD: ${{ secrets.RESTORE_ENCRYPTED_PASSWORD }}`
  - Calls `bash data_layer/backup/restore.sh latest`
- `restore-preprod`:
  - `concurrency: group: restore-preprod` (preserved)
  - `timeout-minutes: 90`
  - Computes yesterday's UTC date in a step (relative to backup-production completion, in the same workflow run): `date -u -d 'yesterday' +%Y-%m-%d` → step output.
  - `TO_DB_URL: ${{ secrets.PREPROD_DB_URL }}`
  - `RESTORE_ENCRYPTED_PASSWORD: ${{ secrets.RESTORE_ENCRYPTED_PASSWORD }}`
  - Calls `bash data_layer/backup/restore.sh "$YESTERDAY_DATE"`.
- Both jobs install `postgresql-client`, `yq`, and AWS CLI (same setup as today).
- In `cd-restore-preprod.yml`: replace `secrets.BACKUP_RESTORE_TO_DB_URL` with `secrets.PREPROD_DB_URL`. Also wire `RESTORE_ENCRYPTED_PASSWORD` into the env so the scrubber applies on manual restores too.
- Note for repo admins: ensure the GitHub Actions secret `RESTORE_ENCRYPTED_PASSWORD` is configured in the `prod` environment before merge. Document in the PR description.
- The existing `BACKUP_RESTORE_TO_DB_URL` secret can be deleted after merge (operational note in U6).

**Patterns to follow:**
- Existing `validate-restore` job structure in `backup-database.yml` lines 59-97.
- Existing `cd-restore-preprod.yml` date-input handling.

**Test scenarios:**
- Happy path: Manual `workflow_dispatch` of `backup-database.yml` produces a backup, then both restore jobs succeed in parallel. Logs show staging resolving the just-made backup; preprod logs show the explicit yesterday date.
- Edge case: `backup-production` fails → both restore jobs are skipped (`needs:` semantics).
- Edge case: D-1 backup is missing in S3 → `restore.sh` failure path (lines 92-106) lists recent backups and exits non-zero; `restore-preprod` fails loudly while `restore-staging` is unaffected.
- Edge case: Concurrent manual `cd-restore-preprod.yml` and nightly `restore-preprod` → second one queues behind the first via the shared `restore-preprod` concurrency group.
- Edge case: 90-minute timeout reached on either restore job → job cancels with loud failure rather than queueing the next nightly behind it.
- Integration: Both restore jobs run the inline scrubber — verify the scrubber log block appears in each.
- Error path: `STAGING_DB_URL` or `PREPROD_DB_URL` unset → `restore.sh` exits at the existing TO_DB_URL guard.
- Error path: `RESTORE_ENCRYPTED_PASSWORD` unset in CI → the scrubber skips the encrypted_password rule (per finding 6 resolution); `phone`/`telephone` rules still apply; log line confirms the skip; nightly does NOT fail.

**Verification:**
- Manual `workflow_dispatch` of `backup-database.yml` shows three jobs in the GitHub Actions UI (`backup-production`, `restore-staging`, `restore-preprod`).
- After a successful run: SQL spot-check confirms staging is fresher than preprod by approximately one day (`MAX(updated_at)` from a high-traffic table).
- PII assertions pass on both: `phone IS NOT NULL` count is 0 on `auth.users` and `telephone IS NOT NULL` count is 0 on `public.dcp` for both staging and preprod.
- `cd-restore-preprod.yml` manual dispatch successfully restores using `PREPROD_DB_URL` (no reference to the retired `BACKUP_RESTORE_TO_DB_URL`).

---

- U4. **Convert `restore.sh` production guard from denylist to allowlist**

**Goal:** Replace the single-prod-ID denylist with an explicit allowlist of staging/preprod project IDs (plus localhost-shape). With more automated restore paths, fail-closed safety matters more.

**Requirements:** R8

**Dependencies:** None

**Files:**
- Modify: `data_layer/backup/restore.sh` (lines 13-16: the denylist guard)

**Approach:**
- Replace the existing single-string denylist check (`if [[ $TO_DB_URL == *"rlarzronkgoyvtdkltqy"* ]]`) with a function/loop that matches `TO_DB_URL` against:
  - The known staging Supabase project ID
  - The known preprod Supabase project ID
  - A localhost-shape regex (e.g., `localhost`, `127.0.0.1`, `host.docker.internal` for local dev with Supabase CLI)
- If no match, refuse with a clear message naming the URL (with credentials masked) and what would have been allowed.
- Keep the `sleep 10` confirmation pause and the credential masking in logs.

**Patterns to follow:**
- Existing credential-masking pattern in `restore.sh` line 165.

**Test scenarios:**
- Happy path: `TO_DB_URL` matching the staging project ID → guard passes, restore proceeds.
- Happy path: `TO_DB_URL` matching the preprod project ID → guard passes.
- Happy path: `TO_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres` → guard passes (localhost shape).
- Error path: `TO_DB_URL` containing the production project ID → guard refuses (the original failure mode, preserved).
- Error path: `TO_DB_URL` for an arbitrary unknown project (not staging, not preprod, not localhost) → guard refuses (new failure-closed behavior; would have passed under the old denylist).

**Verification:**
- Local invocation against the standard local Supabase URL still works.
- A misconfigured arbitrary URL is refused with a clear message before any TRUNCATE or pg_restore happens.

---

- U5. **Remove pgsync workflows, scripts, README, and Earthfile targets**

**Goal:** Retire the now-unused pgsync sync mechanism end-to-end.

**Requirements:** R6

**Dependencies:** U3 (don't delete the sync until the new restore flow is wired in and verified)

**Files:**
- Delete: `.github/workflows/cd-sync.yml`
- Delete: `.github/workflows/cd-sync-preprod.yml`
- Delete: `data_layer/pgsync/sync-databases.sh`
- Delete: `data_layer/pgsync/sync-databases-plans.sh`
- Delete: `data_layer/pgsync/README.md`
- Delete (then `rmdir`): `data_layer/pgsync/` (empty after U1 moved the YAML and the three files above are removed)
- Modify: `Earthfile` — delete `db-sync-build`, `db-sync`, `db-sync-local` targets (search by name; line numbers may shift) and any orphaned references that result.

**Approach:**
- Pre-deletion audit: `grep -rn 'db-sync\|sync-databases\|cd-sync' --include='*.yml' --include='*.sh' --include='*.md' --include='Earthfile' .` returns only the files about to be deleted plus doc references handled in U6.
- Confirm no other workflow `needs:` either of the sync workflows or `uses:` them via `workflow_call`.
- Confirm `data_layer/pgsync/` is empty before `rmdir`.

**Test scenarios:**
- Happy path: After deletion, `grep -r 'pgsync\|db-sync' .github/workflows/` returns no matches.
- Happy path: `earthly +ls` (or equivalent) no longer lists the deleted targets; existing targets still work.
- Edge case: A scheduled run of the deleted `cd-sync.yml` cron does not trigger any orphaned job.
- Integration: `data_layer/pgsync/` does not exist; only `data_layer/backup/restore-config.yml` remains as the policy file.

**Verification:**
- `git status` shows only intended deletions plus the Earthfile edit.
- A round of e2e CI completes successfully with no missing-script errors.

---

- U6. **Update ADR 0016 and READMEs to reflect the new architecture**

**Goal:** Bring canonical documentation in line with the implemented changes.

**Requirements:** R10

**Dependencies:** U1, U2, U3, U4, U5

**Files:**
- Modify: `doc/adr/0016-strategie-backup-database.md`
- Modify: `README.md` (line 125 mentions pgsync — update or remove)
- Modify: `data_layer/README.md` (only if it references pgsync or sync — verify; skip if not)

**Approach:**
- In ADR 0016:
  - Update the file table (lines 185-194): replace `data_layer/pgsync/.pgsync.yml` with `data_layer/backup/restore-config.yml`. Note the inline scrubber in `restore.sh` (no separate script).
  - Update Decision §2 ("Restauration table par table avec pgsync comme source de vérité"): drop the pgsync framing — the YAML stays under a tool-agnostic name.
  - Add a new Decision §7 describing the post-restore scrubber: SCRUB_TABLES allowlist, two rule shapes, env-var resolution for `encrypted_password`, curated PII assertion.
  - Update Decision §4 ("Validation automatique en CI"): replace the single `validate-restore` description with the new dual-restore (`restore-staging` from `latest`, `restore-preprod` from D-1, both inheriting the inline scrubber). Remove the "temporairement désactivée" note. Fix the cron schedule reference: §4 currently says "2h UTC" but the actual schedule is `0 22 * * *` (22h UTC). Update accordingly.
  - Update Decision §5 ("Restauration manuelle à la demande"): note the secret rename to `PREPROD_DB_URL`.
  - Update Decision §6 ("Sécurité"): replace the denylist description with the new allowlist (staging ID, preprod ID, localhost shape).
  - Update the architecture diagram (lines 162-181) to show two parallel restore arrows after backup.
  - Update Conséquences Négatives: remove the pgsync-specific caveat or reframe; remove the denylist-fragility caveat (now an allowlist).
- In root `README.md` line 125: drop the pgsync link; reference the restore script and `restore-config.yml` instead.
- In a new operational-notes paragraph: explain how to add a new scrubbing rule (edit `data_rules` in `restore-config.yml` for new column names within existing allowlisted tables; edit `SCRUB_TABLES` in `restore.sh` for new allowlisted tables). Document that the bcrypt hash lives in `RESTORE_ENCRYPTED_PASSWORD` and is rotated by updating the GitHub Actions secret.

**Test scenarios:**
- Test expectation: none — documentation-only changes; correctness is verified by review against the implementation.

**Verification:**
- ADR 0016 reads coherently against the new code: file table matches `git ls-files data_layer/backup/`; architecture diagram matches the workflow shape; no stale references to `cd-sync.yml`, `data_layer/pgsync/`, or `BACKUP_RESTORE_TO_DB_URL`.
- README + ADR explain the scrubber's table allowlist, rule shapes, env-var resolution, and sanity checklist clearly enough that adding a new rule does not require reading code.

---

## System-Wide Impact

- **Interaction graph:** The Supabase `auth.users → public.dcp` trigger fires on the scrubber's UPDATE to `auth.users`. Because the trigger uses `coalesce(new.phone, telephone)`, the auth-side NULL would otherwise leave `dcp.telephone` populated — the scrubber explicitly UPDATEs `public.dcp.telephone = NULL` to close that loophole (see High-Level Technical Design / Trigger interaction).
- **Error propagation:** A scrubber failure must fail the restore job (`set -euo pipefail` is in effect). A failure on staging must not affect preprod (separate jobs, separate concurrency, separate timeouts).
- **State lifecycle risks:** Per-statement autocommit means a partial scrub leaves the DB partially scrubbed (more anonymized than before, less than intended). Idempotent UPDATE-to-constant statements make a re-run trivially restore the intended state. The 90-minute job timeout bounds the worst case.
- **API surface parity:** The manual `cd-restore-preprod.yml` workflow inherits the scrubber automatically (it calls the same `restore.sh`). Anyone restoring locally also gets it. There is no opt-out, period.
- **Integration coverage:** A full nightly run is the integration test for this work — no separate harness can prove the staging/preprod refresh end-to-end. After the first successful nightly run, do a manual SQL spot-check on both environments (`MAX(updated_at)` from a high-traffic table for freshness; PII checklist for safety).
- **Unchanged invariants:** `backup.sh`, `cleanup.sh`, S3 layout, the manual `cd-restore-preprod.yml` input contract (only the secret name changes), and the `reset_sequences.sql` step are all unchanged. The production guard semantics tighten (allowlist instead of denylist), not loosen.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Scrubber bug leaves credentials un-scrubbed on staging/preprod | Curated PII assertion checklist runs after every restore (`phone IS NOT NULL = 0` on auth.users; `telephone IS NOT NULL = 0` on public.dcp); CI fails on assertion mismatch. The assertion list is the explicit safety contract, separate from the rule-iteration machinery. |
| `auth.users → dcp` trigger leaks `dcp.telephone` | Scrubber explicitly UPDATEs `public.dcp.telephone = NULL` after `auth.users.phone = NULL`, closing the COALESCE loophole. Documented in High-Level Technical Design / Trigger interaction. |
| `RESTORE_ENCRYPTED_PASSWORD` not set in CI | Scrubber skips the `encrypted_password` rule (rather than failing) per the `skip_if_unset: true` semantics. Phone/telephone scrub still applies. Operator detects via the post-scrub log line. |
| D-1 backup missing in S3 (gap day) breaks `restore-preprod` nightly | `restore.sh` already lists recent backups and exits non-zero. Operator can manually invoke `cd-restore-preprod.yml` with a fallback date. (User confirmed prior backups already exist; not expected at rollout.) |
| Removing pgsync workflows breaks something undiscovered | Pre-deletion `grep` audit in U5 covers `.github/`, `data_layer/`, `Earthfile`, `*.md`, `*.sh`. (User accepts the residual risk; deletion ships in the same PR as U1-U4.) |
| Production allowlist (U4) is too tight on day 1 | Allowlist matches localhost-shape so all local dev keeps working. Staging/preprod IDs are encoded in the script; first CI run validates them. If a fourth environment exists (e.g., a personal dev cloud), add it to the allowlist as a follow-up. |
| Long-running restore drifts staging behind prod silently | 90-minute job timeout cancels runaway runs with loud failure. Spot-check `MAX(updated_at)` after the first nightly to confirm freshness behaves as expected. |
| Local devs surprised by default-on scrubbing | Documented in ADR 0016 + README. (User decision: no banner / changelog noise — docs are sufficient.) |

---

## Documentation / Operational Notes

- **Pre-merge:** Configure the GitHub Actions secret `RESTORE_ENCRYPTED_PASSWORD` in the `prod` environment with a freshly-generated bcrypt hash (do NOT reuse the hash currently in `.pgsync.yml`). Document the corresponding cleartext in the team's credential store.
- **Pre-merge:** Confirm `STAGING_DB_URL` and `PREPROD_DB_URL` are configured in the `prod` environment (they should be — pgsync uses them today).
- **Post-merge cleanup:** Delete the now-retired `BACKUP_RESTORE_TO_DB_URL` GitHub Actions secret.
- **First nightly:** Spot-check both environments — `MAX(updated_at)` from a known-active table for freshness; the PII assertions for safety.
- **Adding a new rule to an existing allowlisted table:** edit `data_rules` in `restore-config.yml`. No code change.
- **Adding a new allowlisted table:** edit `SCRUB_TABLES` in `restore.sh`. Code review gate — deliberate.
- **Rotating the bcrypt hash:** update the `RESTORE_ENCRYPTED_PASSWORD` secret in GitHub Actions; next nightly picks up the new value. Coordinate with the team if a shared cleartext is published anywhere.

---

## Sources & References

- Origin: user request in conversation, 2026-04-28, citing `data_layer/pgsync/.pgsync.yml`'s `data_rules` block as the policy source.
- Document review: 2026-04-28 multi-persona review (coherence, feasibility, product-lens, security-lens, scope-guardian, adversarial). 17 findings applied, 4 skipped, 1 silent fix; remainder informed the rewrite.
- Related code: [data_layer/backup/restore.sh](data_layer/backup/restore.sh), [data_layer/backup/reset_sequences.sql](data_layer/backup/reset_sequences.sql), [data_layer/sqitch/deploy/utilisateur/dcp.sql](data_layer/sqitch/deploy/utilisateur/dcp.sql), [.github/workflows/backup-database.yml](.github/workflows/backup-database.yml), [.github/workflows/cd-restore-preprod.yml](.github/workflows/cd-restore-preprod.yml), [Earthfile](Earthfile)
- Related ADR: [doc/adr/0016-strategie-backup-database.md](doc/adr/0016-strategie-backup-database.md)
- External: pgsync `data_rules` documentation (https://github.com/ankane/pgsync#data-rules) for the YAML rule shapes the scrubber must support.
