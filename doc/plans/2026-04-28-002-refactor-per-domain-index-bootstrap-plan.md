---
title: "refactor: move per-index bootstrap to per-domain indexer services"
type: refactor
status: active
date: 2026-04-28
---

# refactor: move per-index bootstrap to per-domain indexer services

## Overview

`SearchIndexerService.onApplicationBootstrap()` currently iterates a central `INDEX_SETTINGS_BY_NAME` aggregator and calls `ensureIndexSettings(indexName, settings)` for all five indexes (`plans`, `fiches`, `indicateurs`, `actions`, `documents`). This refactor moves that responsibility into each per-domain indexer service (`PlanIndexerService`, `FicheIndexerService`, `IndicateurIndexerService`, `ActionIndexerService`, `DocumentIndexerService`), so each domain owns the lifecycle of its own Meilisearch index. The shared SDK wrapper goes back to being purely generic (no domain knowledge of which indexes exist).

The change is structural, not behavioral: at boot, the same five `ensureIndexSettings` calls happen, just dispatched from five places instead of one. The Meilisearch health check stays in `SearchIndexerService.onApplicationBootstrap()` because it is genuinely cross-cutting.

## Problem Frame

The current shape duplicates the "indexes that exist" knowledge: each domain has its own `<DOMAIN>_INDEX` constant + `<DOMAIN>_INDEX_SETTINGS` definition in `search-indexes.constants.ts`, and the wrapper has a parallel `INDEX_SETTINGS_BY_NAME` aggregator that lists all five again. Adding a sixth indexed entity in the future requires touching three places (constants, aggregator, plus the new indexer module). With per-domain bootstrap, adding a new entity requires touching only the new indexer service plus its own constants — the wrapper is unaware of the index list.

The motivating signal: the wrapper's `onApplicationBootstrap` is the only place in the codebase that aggregates index knowledge, and it exists solely so that one method can iterate a list. The aggregation is a wart, not a load-bearing abstraction.

---

## Requirements Trace

- R1. At boot, the same five `ensureIndexSettings` calls execute (one per index) with identical settings to today.
- R2. A Meilisearch outage at boot continues to be tolerated — the backend must start regardless. Each per-domain indexer's bootstrap call is wrapped defensively.
- R3. `SearchIndexerService` no longer references any specific index name or per-index settings. The wrapper has zero domain knowledge.
- R4. The shared `INDEX_SETTINGS_BY_NAME` aggregator in `search-indexes.constants.ts` is removed (no remaining callers).
- R5. The Meilisearch `health()` log at boot stays in `SearchIndexerService` (cross-cutting, not per-index).
- R6. The U8 admin rebuild flow continues to work unchanged — it calls `ensureIndexSettings` directly with the temp index name and the relevant settings constant, so it is unaffected by where the live-index bootstrap is dispatched from.

---

## Scope Boundaries

- No change to the `ensureIndexSettings` method signature or behavior.
- No change to per-index settings (searchable attributes, filterable attributes, localized attributes).
- No change to the Meilisearch SDK version, the `MEILI_HOST` / `MEILI_MASTER_KEY` config keys, or any indexer's queue / processor wiring.
- No change to any write-path enqueue, the read-side proxy, or the admin backfill router.
- The U1 commit's promise that "settings are idempotent across boot" is preserved — re-applying identical settings is still safe.

---

## Context & Research

### Relevant Code and Patterns

- Current bootstrap loop: `apps/backend/src/utils/search-indexer/search-indexer.service.ts` lines 87–110 (the loop over `INDEX_SETTINGS_BY_NAME`).
- Wrapper `ensureIndexSettings` API: `apps/backend/src/utils/search-indexer/search-indexer.service.ts` lines 265–271 (stays as-is).
- Per-index settings declarations and the soon-to-be-removed aggregator: `apps/backend/src/utils/search-indexer/search-indexes.constants.ts` — exports `<DOMAIN>_INDEX` constants, `<DOMAIN>_INDEX_SETTINGS` constants, and `INDEX_SETTINGS_BY_NAME`.
- Per-domain indexer services to extend with `OnApplicationBootstrap`:
  - `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts`
  - `apps/backend/src/plans/fiches/fiche-indexer/fiche-indexer.service.ts`
  - `apps/backend/src/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service.ts`
  - `apps/backend/src/referentiels/action-indexer/action-indexer.service.ts`
  - `apps/backend/src/collectivites/documents/document-indexer/document-indexer.service.ts`
- Defensive bootstrap pattern to mirror: `apps/backend/src/utils/search-indexer/search-indexer.service.ts` lines 87–110 — `try { … } catch { logger.warn(…) }` so the backend boots even if Meilisearch is unreachable.
- U8 admin rebuild already calls `ensureIndexSettings` directly: `apps/backend/src/search/search-admin.service.ts` line 241. This usage is unchanged by the refactor and proves the API contract is fine.
- Existing test mocks already stub `ensureIndexSettings` to no-op in unit tests: `apps/backend/src/search/search.router.e2e-spec.ts` line 648. Each new indexer-level bootstrap call must be mockable the same way in any per-domain unit tests that already stub `SearchIndexerService`.

### Institutional Learnings

- ADR 0006 (`doc/adr/0006-plateforme-background-jobs.md`) — Meilisearch and Redis are external dependencies tolerated at boot; failure-to-reach must not crash the backend. This refactor preserves that property at each per-domain bootstrap.

---

## Key Technical Decisions

- **Each indexer implements `OnApplicationBootstrap` independently and calls `searchIndexer.ensureIndexSettings(<INDEX>, <SETTINGS>)` from its own `onApplicationBootstrap()` method.** No new method is added to the SDK wrapper — `ensureIndexSettings` is already the right API (idempotent, creates the index if missing, applies settings).
- **Each per-domain bootstrap is wrapped in `try { … } catch { logger.warn(…) }`.** Identical defensive shape to today's central bootstrap. A Meilisearch outage at boot logs a warning per-domain and lets the backend start.
- **`SearchIndexerService.onApplicationBootstrap()` keeps the `health()` log only.** The per-index loop is removed. This preserves the cross-cutting health signal while removing the wrapper's per-index knowledge.
- **`INDEX_SETTINGS_BY_NAME` is deleted** from `search-indexes.constants.ts`. The per-domain indexers each import their own `<DOMAIN>_INDEX` and `<DOMAIN>_INDEX_SETTINGS` directly. The aggregator has no remaining callers after U1 of this plan ships.
- **No change to the `ensureIndexSettings` method signature.** Renaming to e.g. `createIndexWithSettings` was considered and rejected: cosmetic, breaks U8's call site, no semantic improvement. The existing name accurately describes the contract (idempotent settings application that creates the index if needed).
- **Order of bootstrap dispatch is non-deterministic across modules** (NestJS does not guarantee a deterministic `onApplicationBootstrap` ordering across `@Global` and feature modules). Acceptable: each call is independent; settings are idempotent; failure of any one doesn't block the others (each is in its own try/catch).

---

## Open Questions

### Resolved During Planning

- **Should a new SDK method be added (e.g. `createIndexWithSettings`)?** No. The existing `ensureIndexSettings` is the right API and is already used by the U8 rebuild path.
- **Should the bootstrap order be enforced (e.g. via explicit `await`)?** No. NestJS dispatches `onApplicationBootstrap` per module without cross-module ordering guarantees, and Meilisearch settings are idempotent — order doesn't affect correctness.
- **Should `INDEX_SETTINGS_BY_NAME` be kept as documentation?** No. Once unused, dead exports become drift candidates. Deleting it forces future readers to navigate to each indexer service to understand which indexes exist — which is exactly the structural shape we're moving toward.

### Deferred to Implementation

- **Where in each indexer's class does `onApplicationBootstrap` go?** Cosmetic — implementer picks a location consistent with other lifecycle methods. Below the constructor is conventional in this codebase.
- **Logger message wording.** Each domain's `logger.warn` text is the implementer's call; the existing "Échec de l'application des réglages…" phrasing in the wrapper is a fine starting point.

---

## Implementation Units

- U1. **Move per-index bootstrap out of `SearchIndexerService`**

**Goal:** Remove the per-index loop from the wrapper's `onApplicationBootstrap`, delete the now-unused `INDEX_SETTINGS_BY_NAME` aggregator, and keep the Meilisearch health log.

**Requirements:** R3, R4, R5.

**Dependencies:** None. This unit can ship before or after U2 — the period between U1 and U2 has no per-index bootstrap (settings are still applied lazily by Meilisearch when documents are upserted, and the U8 admin rebuild applies them explicitly), so the live system continues to function. Recommend shipping U2 first to avoid a window where settings aren't reapplied at boot.

**Files:**
- Modify: `apps/backend/src/utils/search-indexer/search-indexer.service.ts`
  - Drop the import of `INDEX_SETTINGS_BY_NAME`.
  - Remove the `for (const { indexName, settings } of INDEX_SETTINGS_BY_NAME)` loop from `onApplicationBootstrap()`.
  - Keep the `health()` try/catch + log.
- Modify: `apps/backend/src/utils/search-indexer/search-indexes.constants.ts`
  - Delete the `INDEX_SETTINGS_BY_NAME` export.
  - Update the JSDoc on the per-index `*_INDEX_SETTINGS` constants to remove the reference to "applied via `SearchIndexerService.ensureIndexSettings(...)` au démarrage du backend (`onApplicationBootstrap`)" — the bootstrap site has moved, point to the per-domain indexer services instead.
- Test: no new tests. The wrapper's e2e spec (`apps/backend/src/utils/search-indexer/search-indexer.service.e2e-spec.ts`) already exercises `ensureIndexSettings` directly and does not assert on the bootstrap behavior — verify on a quick read that no test asserts the loop runs at app start.

**Approach:**
- Surgical deletion: the wrapper's `onApplicationBootstrap` body shrinks to the existing `health()` block.
- The wrapper still implements `OnApplicationBootstrap` so the lifecycle hook stays mounted; only its body changes.
- Constants file loses one export. No need to remove the per-index `*_INDEX_SETTINGS` exports — those move callers, not disappearance.

**Patterns to follow:**
- Existing `health()` defensive try/catch in `apps/backend/src/utils/search-indexer/search-indexer.service.ts` lines 87–97 — the surviving body of `onApplicationBootstrap`.

**Test scenarios:**
- *Test expectation: none — purely a removal. Behavior coverage moves to U2. Verify by inspection that no existing test in `search-indexer.service.e2e-spec.ts` assumes the bootstrap loop runs.*

**Verification:**
- `INDEX_SETTINGS_BY_NAME` has zero remaining references in the codebase (`grep` returns nothing).
- `SearchIndexerService` no longer imports any per-index constant.
- Backend typecheck (`pnpm exec tsc -p apps/backend/tsconfig.app.json --noEmit`) passes with no new errors.

---

- U2. **Add `OnApplicationBootstrap` to each per-domain indexer**

**Goal:** Each of the five per-domain indexer services implements `OnApplicationBootstrap` and applies its own index settings defensively at boot.

**Requirements:** R1, R2, R6.

**Dependencies:** None functionally; can land before or after U1 (a brief overlap is harmless because `ensureIndexSettings` is idempotent — both sites running the same settings call back-to-back is a no-op on the second call). Recommend landing U2 in the same PR as U1.

**Files:**
- Modify: `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts`
- Modify: `apps/backend/src/plans/fiches/fiche-indexer/fiche-indexer.service.ts`
- Modify: `apps/backend/src/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service.ts`
- Modify: `apps/backend/src/referentiels/action-indexer/action-indexer.service.ts`
- Modify: `apps/backend/src/collectivites/documents/document-indexer/document-indexer.service.ts`
- Test: e2e specs adjacent to each indexer (already exist, gated on `MEILI_HOST`); add one bootstrap-applies-settings scenario per indexer or extend an existing one — see Test scenarios below.

**Approach:**
- Each indexer adds `OnApplicationBootstrap` to its `implements` list and gains an `async onApplicationBootstrap()` method.
- The method body is a single defensive call:
  - Read the relevant `<DOMAIN>_INDEX` and `<DOMAIN>_INDEX_SETTINGS` from `apps/backend/src/utils/search-indexer/search-indexes.constants.ts`.
  - Call `searchIndexer.ensureIndexSettings(<INDEX>, <SETTINGS>)` inside try/catch; on failure, `logger.warn` with a domain-specific message ("Échec de l'application des réglages pour l'index `${INDEX_NAME}` au démarrage…").
  - Do NOT throw — the backend must boot regardless of Meilisearch state (R2).
- `PlanIndexerService` already extends `WorkerHost` (BullMQ) — adding `OnApplicationBootstrap` to its implements list is additive, no clash.
- Note: `PlanIndexerService` and the four siblings are all `@Injectable()` providers in their respective modules, so NestJS will invoke `onApplicationBootstrap` automatically — no extra registration is required.

**Patterns to follow:**
- Defensive bootstrap shape: `apps/backend/src/utils/search-indexer/search-indexer.service.ts` lines 87–109 (the existing per-index loop with its try/catch is the model — each indexer's bootstrap is exactly one iteration of that loop).
- `OnApplicationBootstrap` lifecycle import: `import { OnApplicationBootstrap } from '@nestjs/common'`.

**Test scenarios:**
- Happy path (per indexer, gated on `MEILI_HOST`): instantiate the indexer via `Test.createTestingModule(...)` with a real `SearchIndexerService`, call `app.init()` (which fires `onApplicationBootstrap`), then assert the index exists in Meilisearch with the expected `searchableAttributes` and `filterableAttributes`.
- Edge case (per indexer, mocked): mock `SearchIndexerService.ensureIndexSettings` to throw → assert the indexer's `onApplicationBootstrap` does NOT throw and the warning is logged. Use Vitest's `vi.spyOn(logger, 'warn')` or `expect(...).resolves.not.toThrow()`.
- Integration: at app boot with Meilisearch reachable, all five indexes exist with their settings applied (effectively the assertion already covered by `apps/backend/src/utils/search-indexer/search-indexer.service.e2e-spec.ts` `ensureIndexSettings` tests, retargeted to verify the per-domain dispatch produces the same outcome).

**Verification:**
- `grep -rn "OnApplicationBootstrap" apps/backend/src/plans/plans/plan-indexer apps/backend/src/plans/fiches/fiche-indexer apps/backend/src/indicateurs/indicateurs/indicateur-indexer apps/backend/src/referentiels/action-indexer apps/backend/src/collectivites/documents/document-indexer` returns five matches.
- Booting the backend locally (with Meilisearch up) shows five "settings applied" log lines (or domain-specific equivalents), one per indexer.
- Booting the backend locally (with Meilisearch *down*) shows five `logger.warn` lines and the backend reaches a healthy state regardless.

---

## System-Wide Impact

- **Interaction graph:** No new callbacks or middleware. NestJS already dispatches `onApplicationBootstrap` to every `@Injectable()` provider that implements the interface; this refactor adds five subscribers and removes one. Total work at boot is unchanged.
- **Error propagation:** Identical to today — each bootstrap call swallows Meilisearch errors with `logger.warn`. No exception escapes the lifecycle hook.
- **State lifecycle risks:** None new. Meilisearch settings are idempotent. If a per-indexer bootstrap fails partway (e.g. one of the five indexes can't reach Meilisearch), the others still apply their settings independently — slightly *better* fault isolation than the current centralized loop, where a transient `await` hang could starve later iterations.
- **API surface parity:** The `SearchIndexerService` public API is unchanged. The U8 admin rebuild flow's call to `ensureIndexSettings(tempIndex, settings)` continues to work as-is.
- **Integration coverage:** Cross-layer behavior is unchanged. The existing e2e specs that exercise live Meilisearch (one per indexer + the wrapper + the read/admin routers, all gated on `MEILI_HOST`) provide the regression net.
- **Unchanged invariants:** the `ensureIndexSettings` method, the per-index settings, the queue / processor wiring, the read-side proxy filters, and the admin backfill flow are all left intact.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| **A new indexer added in the future forgets to wire `onApplicationBootstrap`.** Adding a sixth entity index without registering its bootstrap means its settings never get applied automatically (Meilisearch falls back to defaults; queries break). | Document the convention in ADR 0017 (or a follow-up). The existing five indexers serve as the template. The U8 admin rebuild + a test that asserts settings are applied at boot for each indexer surface the gap quickly. |
| **Bootstrap ordering becomes a question if a future feature relies on indexes being ready before some other component runs.** | Today nothing depends on per-index bootstrap timing. If a future feature does, the right fix is a dedicated NestJS lifecycle hook (`onApplicationBootstrap` returns a Promise that NestJS awaits per module — the order between modules is non-deterministic but each individual hook is awaited). Document the constraint when it arises; do not pre-engineer for it. |
| **`logger.warn` floods at boot when Meilisearch is unreachable** — instead of one warning, operators now see five. | Acceptable trade-off. Each warning names the specific index that failed, which is more diagnostic than a single generic warning. If signal-to-noise becomes an issue, fold the five logs into one summary via a tiny aggregator (out of scope here). |
| **Test files that mock `SearchIndexerService` for unit tests of indexer services** may need to add a stub for `ensureIndexSettings` to avoid hitting a real Meilisearch in tests that previously didn't go through the bootstrap path. | Read each indexer's existing spec; add the stub where needed. The pattern already exists in `apps/backend/src/search/search.router.e2e-spec.ts` line 648. |

---

## Sources & References

- Affected wrapper: [apps/backend/src/utils/search-indexer/search-indexer.service.ts](apps/backend/src/utils/search-indexer/search-indexer.service.ts)
- Affected constants: [apps/backend/src/utils/search-indexer/search-indexes.constants.ts](apps/backend/src/utils/search-indexer/search-indexes.constants.ts)
- Per-domain indexers (all five gain `OnApplicationBootstrap` in U2):
  - [apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts](apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts)
  - [apps/backend/src/plans/fiches/fiche-indexer/fiche-indexer.service.ts](apps/backend/src/plans/fiches/fiche-indexer/fiche-indexer.service.ts)
  - [apps/backend/src/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service.ts](apps/backend/src/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service.ts)
  - [apps/backend/src/referentiels/action-indexer/action-indexer.service.ts](apps/backend/src/referentiels/action-indexer/action-indexer.service.ts)
  - [apps/backend/src/collectivites/documents/document-indexer/document-indexer.service.ts](apps/backend/src/collectivites/documents/document-indexer/document-indexer.service.ts)
- Architecture context: [doc/adr/0017-meilisearch-global-search-architecture.md](../adr/0017-meilisearch-global-search-architecture.md)
- Original implementation plan: [doc/plans/2026-04-27-002-feat-meilisearch-global-search-plan.md](2026-04-27-002-feat-meilisearch-global-search-plan.md)
