---
title: "refactor: split search-doc schemas, rename to camelCase, surface plan-vs-axe in modal"
type: refactor
status: active
date: 2026-05-04
---

# refactor: split search-doc schemas, rename to camelCase, surface plan-vs-axe in modal

## Overview

Three coordinated changes to the Meilisearch global search feature:

1. **Schema co-location.** Move the 5 per-entity search-doc Zod schemas out of the central `packages/domain/src/search/search-document.schema.ts` and into per-domain files (`<entity>-search-doc.schema.ts`) co-located with the rest of each domain's types. Rename symbols so each schema name matches its backing database table: `PlanDocSchema` / `PlanDoc` → `AxeSearchDocSchema` / `AxeSearchDoc` (sourced from the `axe` table); the other four take the consistent `<Entity>SearchDocSchema` / `<Entity>SearchDoc` form (`FicheSearchDocSchema`, `IndicateurSearchDocSchema`, `ActionSearchDocSchema`, `DocumentSearchDocSchema`).
2. **camelCase document field names.** Rename every indexed document field from snake_case to camelCase (`collectivite_id` → `collectiviteId`, `parent_id` → `parentId`, `visible_collectivite_ids` → `visibleCollectiviteIds`, etc.). This aligns search docs with the rest of the TypeScript codebase and removes the snake_case carve-out documented in the current header. The change touches: schema definitions, indexer `toDocument` transforms, `*_INDEX_SETTINGS` constants (`filterableAttributes` / `searchableAttributes`), the read-side proxy's filter strings + `_formatted` / raw-hit accessors + `HIGHLIGHT_CROP_BY_INDEX`, and frontend `contextFields` accessors.
3. **Plan vs Axe distinction in the search UI.** `AxeSearchDocSchema.parentId` already exists — root plans have `parentId === null`, sub-axes have `parentId !== null`. Mirror the existing Action/Sous-action UX exactly: add an `axes` chip alongside `plans`, expose a `planParentFilter` request input (analogue of `ficheParentFilter`), split the `plans` bucket into two visual sections in the modal (`'plans:root'` / `'plans:axe'`), and swap the row badge between `"Plan"` and `"Axe"` based on `parentId`.

The work is **breaking at the document level**: every existing index has snake_case docs and snake_case `filterableAttributes` settings. After deploy, `ensureIndexSettings` re-applies camelCase settings on boot (idempotent overwrite), but the stored documents still carry snake_case keys. Tenant filters then match nothing → search silently returns 0 hits across all 5 indexes. The mitigation is a hard deploy-time runbook: deploy, then run `search.admin.reindex<Entity> { mode: 'rebuild' }` for all 5 entities (the `'rebuild'` swap-indexes flow drops stale snake_case content; `'upsert'` is insufficient because it merges new fields onto existing docs without removing the old ones).

---

## Problem Frame

The Meilisearch global search shipped on this branch (commits `1ccad009d` through `da9fc0163`) made three pragmatic choices that need revisiting now that the feature is otherwise complete:

- **Snake_case doc fields** — chosen "to match the underlying table columns" (per the current header in `packages/domain/src/search/search-document.schema.ts`). In practice, no other shared schema in `@tet/domain` exposes snake_case to consumers — every other domain schema (`axeTableSchema`, `bibliothequeFichierSchema`, `indicateurDefinitionSchema`, …) uses camelCase. The carve-out leaks into 5 indexer transforms, the read-side proxy filter strings, frontend `contextFields` accessors (`ctx['parent_id']`, `ctx['action_id']`, …), the e2e test fixtures, and the JSDoc on `buildTenantFilter`. Removing it now is cheaper than later when more callers attach.
- **Single-file consolidated schemas** — `packages/domain/src/search/search-document.schema.ts` defines all 5 doc shapes in one file under a `search` scope. The rest of the domain package is organized by entity (`plans/`, `indicateurs/`, `referentiels/`, `collectivites/`); search docs are the outlier. Splitting them into per-domain files makes each domain folder self-contained and matches how the indexer services in `apps/backend/src/` are already organized (per-domain).
- **Plans and Axes share the same row treatment** — the search modal currently renders both top-level plans (`axe.parent IS NULL`) and sub-axes (`axe.parent IS NOT NULL`) under one "Plans" section with the same badge. The Action/Sous-action distinction is already surfaced for fiches via a chip + section split + badge swap. The existing `parent_id` field on the doc carries the information; only UI wiring is missing.

---

## Requirements Trace

- **R1.** Per-entity search-doc schemas live under their owning domain folder in `packages/domain/src/`, named `<entity>-search-doc.schema.ts`. The schema sourced from the `axe` table exports `AxeSearchDocSchema` / `AxeSearchDoc`; the other four export `<Entity>SearchDocSchema` / `<Entity>SearchDoc` matching their backing entity (`FicheSearchDoc`, `IndicateurSearchDoc`, `ActionSearchDoc`, `DocumentSearchDoc`).
- **R2.** Every indexed Meilisearch document field name is camelCase. No snake_case keys remain in stored docs, in `*_INDEX_SETTINGS` attribute lists, in tenant-filter strings, in proxy `contextFields` keys, or in frontend accessors.
- **R3.** The search modal differentiates root plans from sub-axes through a dedicated `axes` chip, a separate visual section in the result list, and a per-row badge that says `"Axe"` for sub-axes.
- **R4.** Backend tenant filtering for the `plans` index supports a `planParentFilter` of `'all' | 'root' | 'axe'`, mirroring the existing `ficheParentFilter`.
- **R5.** The migration runbook is documented and discoverable: an operator with shell access can rebuild all 5 indexes via the existing admin endpoints in a single deploy window with no manual Meilisearch SDK calls.
- **R6.** ADR 0017 (`doc/adr/0017-meilisearch-global-search-architecture.md`) reflects the new schema layout, the camelCase convention, and the plan/axe chip/section/badge pattern; statements about snake_case docs or the consolidated schema file are corrected.
- **R7.** Existing test coverage (domain schema spec, 5 indexer e2e specs, search-router e2e, search-admin-router e2e, frontend rows test) passes after the migration with camelCase fixtures.

---

## Scope Boundaries

- The 5 Meilisearch indexes themselves keep their snake_case names (`plans`, `fiches`, `indicateurs`, `actions`, `documents`) — only document field keys change.
- No new entity types are added to search; the existing 5 (Plan/Axe, Action/Sous-action, Indicateur, Mesure, Document) cover the chip set.
- Database column names in Postgres stay snake_case. Drizzle-generated camelCase accessors already exist on every relevant table; the indexer transforms pass them straight through after the rename.
- Navigation behavior for sub-axes is **not** changed: the existing `makeCollectivitePlanActionUrl({ planActionUid: planId })` route in `use-search-hit-navigation.ts` continues to handle both root plans and sub-axes uniformly. If the existing URL handler does not render sub-axes correctly, that's a separate bug — out of scope for this plan.
- The composite primary key on the `actions` index (`'${actionId}:${collectiviteId}'`) is unchanged. Renaming `id` to anything else would force a full reindex AND change `addDocuments` semantics — not worth it for a cosmetic change.
- The set of `searchableAttributes` per index is preserved 1:1 (only the casing of the names changes). No fields are added or removed from search relevance.
- Plan/axe navigation deep-linking (e.g., scrolling to the sub-axe inside its parent plan tree) is deferred to follow-up.

### Deferred to Follow-Up Work

- Cross-axe-tree navigation (anchor a sub-axe inside its parent plan view): out of scope here, separate UX investigation.
- Refactoring the snake_case `SearchIndexName` enum values themselves (`'plans'`, `'fiches'`, `'indicateurs'`, `'actions'`, `'documents'`) — these are index names, not field names, and are already lowercase single-words.

---

## Context & Research

### Relevant Code and Patterns

- **Current consolidated schema file:** `packages/domain/src/search/search-document.schema.ts` (5 schemas, 1 spec at `packages/domain/src/search/search.schema.spec.ts` lines 107–253).
- **Existing per-domain schema precedents** to mirror for placement:
  - `packages/domain/src/plans/plans/plan.schema.ts` — root plan domain types.
  - `packages/domain/src/plans/fiches/axe.schema.ts` — the `axe` table's domain types live under `plans/fiches/`. The new `AxeSearchDocSchema` co-locates here too (see **Key Technical Decisions**).
  - `packages/domain/src/plans/fiches/fiche.schema.ts`.
  - `packages/domain/src/indicateurs/definitions/indicateur-definition.schema.ts`.
  - `packages/domain/src/referentiels/actions/action-definition.schema.ts`.
  - `packages/domain/src/collectivites/documents/bibliotheque-fichier.schema.ts`.
- **Existing fiche-parent-filter pattern** (the template to mirror for plan-parent-filter):
  - `packages/domain/src/search/search-request.schema.ts` lines 12–17, 24 — `ficheParentFilterSchema` enum + `SearchRequestSchema.ficheParentFilter` field with `.default('all')`.
  - `apps/backend/src/search/search.service.ts` lines 180–200 — `buildTenantFilter` switch case for `'fiches'` composing the filter string.
  - `apps/app/src/search/search-modal.tsx` lines 23–73 — chip union, `CHIPS` array, `ALL_CHIPS_ENABLED`, `chipsToBackendInput` mapping chip state to `enabledIndexes` + `ficheParentFilter`.
  - `apps/app/src/search/search-result-list.tsx` lines 24–48, 83–100 — `BucketSlot` union with `'fiches:top-level'` / `'fiches:sous-action'`, `BUCKET_ORDER`, `BUCKET_LABEL`, partition by `contextFields['parent_id']` in `flattenSearchResponse`.
  - `apps/app/src/search/search-result-row-fiche.tsx` lines 36–53 — badge label swap by `parent_id`.
- **Per-domain bootstrap pattern** (idempotent settings application on every backend boot, established by plan `2026-04-28-002`):
  - Each indexer service implements `OnApplicationBootstrap` and calls `searchIndexer.ensureIndexSettings(<INDEX>, <SETTINGS>)`. `ensureIndexSettings` (`apps/backend/src/utils/search-indexer/search-indexer.service.ts` lines 333–339) wraps `index.updateSettings(...)` — idempotent overwrite, picks up new camelCase attribute names automatically once the constants change.
- **Admin rebuild flow** (the document-migration path):
  - `apps/backend/src/search/search-admin.service.ts` `rebuildEntity` (lines 233–298): Redis lock → temp index → settings on temp → bulk reindex onto temp → swap → drop stale.
  - Five admin tRPC procedures, one per entity, on `apps/backend/src/search/search-admin.router.ts`.
- **Snake_case migration surface (every reference to the 5 schemas / fields):**
  - 5 indexer services with `toDocument` transforms in both `indexAll()` and `loadXxxDoc()`:
    - `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts` lines 207–218 (indexAll), 311–336 (loadPlanDoc).
    - `apps/backend/src/plans/fiches/fiche-indexer/fiche-indexer.service.ts` lines 272–281 (indexAll), 363–400 (loadFicheDoc).
    - `apps/backend/src/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service.ts` lines 240–248, 328–359.
    - `apps/backend/src/referentiels/action-indexer/action-indexer.service.ts` lines 448–457 (loadActionDoc), 543–569 (fanoutReferentiel), 626–649 (fanoutCollectiviteOnReferentiel).
    - `apps/backend/src/collectivites/documents/document-indexer/document-indexer.service.ts` lines 218–222, 308–333.
  - 5 `*_INDEX_SETTINGS` constants files (one per indexer folder).
  - Read-side proxy `apps/backend/src/search/search.service.ts`: `buildTenantFilter` lines 177–200, `shapeHit` lines 256–365, `HIGHLIGHT_CROP_BY_INDEX` lines 372–396.
  - Frontend `_formatted` / `contextFields` accessors: `apps/app/src/search/search-result-list.tsx` line 92, `search-result-row-fiche.tsx` line 37, `search-result-row-action.tsx` lines 51, 57, 60, `search-result-row-indicateur.tsx` lines 36–37, `use-search-hit-navigation.ts` lines 52, 70, 73.
  - Tests: `packages/domain/src/search/search.schema.spec.ts`, `apps/backend/src/search/search.router.e2e-spec.ts` (~70 occurrences in `seedXxxDoc` helpers + filter-literal asserts), `apps/backend/src/search/search-admin.router.e2e-spec.ts` (lines 97, 104, 181, 228, 251, 267, 286), 5 indexer e2e specs, `apps/app/src/search/__tests__/search-result-rows.test.tsx` (lines 108–359).
- **Conventions** (per `doc/adr/0003-conventions-de-code.md`): kebab-case files, `.schema.ts` suffix for Zod schemas, per-scope `index.ts` barrels with `export * from './<file>';`. `@tet/domain` exports each scope as a subpath (`@tet/domain/plans`, `@tet/domain/indicateurs`, …) — there is no aggregator at root.

### Institutional Learnings

- `ce-learnings-researcher` found nothing directly applicable in `doc/solutions/`. No prior Meilisearch index-rename migrations, no prior breaking changes to `@tet/domain` exports, no documented camelCase/snake_case convention call. The 4 existing `doc/solutions/` entries cover unrelated topics (history repos, Drizzle SELECT FOR UPDATE, Zod `.partial()` + `.default()`, e2e parallel isolation). One weakly-tangential note: if a future "patch a single doc" admin endpoint composes `<Entity>SearchDocSchema.partial()`, watch for the `.default()` leak documented in `doc/solutions/logic-errors/zod-default-leaks-into-partial-update-schema.md`.
- Worth capturing as a `doc/solutions/` learning **after** this lands: the index-rename runbook (settings-reset + mandatory rebuild for all entities) and the rationale for camelCase doc fields. Both are exactly the kind of decision that gets re-discovered painfully if undocumented.

### External References

External research was skipped — local patterns are dense (4 prior Meilisearch-feature commits on this branch, established per-domain bootstrap pattern, established fiche-parent-filter template, mature admin rebuild flow). Nothing in this work needs Meilisearch SDK behavior beyond what's already used.

---

## Key Technical Decisions

- **`AxeSearchDocSchema` (not `PlanSearchDocSchema`) lives at `packages/domain/src/plans/fiches/axe-search-doc.schema.ts`** — co-located with the existing `axe.schema.ts`. Rationale: the indexer reads from the `axe` table, every row in the index represents an `Axe` row, and `axe.parent IS NULL` is what discriminates a root plan from a sub-axe. Naming the schema after the user-facing chip (`Plan`) would create the misleading impression that there's a separate `plan` entity at the database layer — there isn't. Keeping the file next to `axe.schema.ts` puts both `Axe` shapes in the same folder.
- **Other 4 schemas keep their entity-named form** (`FicheSearchDocSchema`, `IndicateurSearchDocSchema`, `ActionSearchDocSchema`, `DocumentSearchDocSchema`). These already match their conceptual entities closely enough that the naming reads naturally; only `Plan` was misleading because the chip name diverges from the table name.
- **Symbol naming stays PascalCase const-and-type** (`AxeSearchDocSchema` / `AxeSearchDoc`), matching the existing `SearchHitSchema`, `SearchRequestSchema`, `BucketSchema`, `FicheParentFilterSchema` style in `packages/domain/src/search/`. The rest of the domain package uses camelCase const + PascalCase type (`axeTableSchema` / `Axe`); the search-folder convention is the closer sibling, and sticking with it avoids a third style.
- **`<Entity>SearchDoc` (not `<Entity>SearchDocument`)** — keeps the existing `Doc` short form, just clarifies the noun. The full word would lengthen call sites unnecessarily.
- **The chip stays labeled `Plans` / `Axes`** even though the schema is `AxeSearchDocSchema`. Index name (`'plans'`), chip key (`'plans'` / `'axes'`), chip label (`Plans` / `Axes`), and indexer service name (`PlanIndexerService`) reflect the user-facing concept — the schema name reflects the backing table. Both groups can stay internally consistent.
- **camelCase casing strategy: `_id` becomes `Id` (one word, lowercase rest)** — `collectivite_id` → `collectiviteId`, `parent_id` → `parentId`, `action_id` → `actionId`, `referentiel_id` → `referentielId`, `groupement_id` → `groupementId`, `identifiant_referentiel` → `identifiantReferentiel`, `titre_long` → `titreLong`, `visible_collectivite_ids` → `visibleCollectiviteIds`. This matches Drizzle-generated accessors already used inside the indexers and removes one transformation step in `toDocument`.
- **Schema split in U1, camelCase rename in U2/U3/U4 — kept as separate units** even though they touch many of the same files. Rationale: U1 is a pure mechanical move (zero behavior change, types-only) and can ship independently if review pressure forces a split. The casing change is the actual breaking migration and benefits from being a focused, reviewable diff per layer (write side / read side / frontend).
- **U2 + U3 + U4 must ship in the same release.** The casing change is split into 3 commits for review clarity but cannot be deployed in pieces — partial rollout breaks search at the read or render stage. The plan units expose the split only for review purposes; `ce-work` may bundle them into one PR.
- **Use the `'rebuild'` admin mode (not `'upsert'`) post-deploy.** `'upsert'` writes camelCase docs onto existing snake_case docs, which Meilisearch merges per-document — leaving stale snake_case fields attached. `'rebuild'` builds a fresh temp index, swaps atomically, and drops the stale content. This is the documented per-entity flow in `SearchAdminService.rebuildEntity`.
- **`planParentFilter` enum values: `'all' | 'root' | 'axe'`** — not `'top-level' | 'sous-action'` (the fiche analogue's value), because plan terminology is different. `'root'` reads more naturally in code (`parentId IS NULL`) than `'top-level-plan'`, and `'axe'` matches the UI badge label exactly.
- **Bucket slots: `'plans:root'` and `'plans:axe'`** (mirroring `'fiches:top-level'` and `'fiches:sous-action'`). The colon-prefix convention is already established in `BucketSlot`.
- **Chip rendering after split: 7 chips total** in `CHIPS` array order: Plans, Axes, Actions, Sous-actions, Indicateurs, Mesures, Documents. The new `axes` chip slots between `plans` and `actions`. `ALL_CHIPS_ENABLED` and the `exclusiveMode` reset object both need the new key.

---

## Open Questions

### Resolved During Planning

- **What name and location for the schema sourced from the `axe` table?** → `AxeSearchDocSchema` at `packages/domain/src/plans/fiches/axe-search-doc.schema.ts`, co-located with `axe.schema.ts`. The schema is named for the table it sources from, not for the user-facing chip (see Key Technical Decisions).
- **Should the camelCase rename also touch the index names (`plans`, `fiches`, …) or `SearchHitType` enum values (`'plan' | 'fiche' | …`)?** → No. Index names are external identifiers and changing them would force a re-create (not just rebuild). Hit-type values are user-facing strings the frontend already keys on — out of scope.
- **Chip + section split + badge for plan/axe, or just one of the three?** → All three, exactly mirroring the fiche/sous-action UX. The user explicitly asked for parity.
- **Do `'upsert'` or `'rebuild'` post-deploy?** → `'rebuild'` (see Key Technical Decisions).

### Deferred to Implementation

- **Splitting `search.schema.spec.ts` per-domain vs. keeping a single search-side spec.** The 5 per-doc `describe(...)` blocks (lines 107–253) are independent; each could move to its destination folder alongside its schema. The request-schema describe block stays in the search folder. Concrete shape (file count, naming) is fine to decide at implementation time based on what reads cleanly.
- **Whether to keep temporary type aliases (`PlanDoc`, `FicheDoc`, etc.) as deprecation shims or hard-cut to the new names.** The 5 imports across indexer services are small and easy to migrate; hard-cut probably wins. Confirm during implementation.
- **Whether to split U2 into per-indexer commits or one bundled commit.** The 5 indexers are independent; per-indexer commits read better but are more diff-heavy. Implementer's call.
- **Exact placement of plan-vs-axe chip in the chip array order.** The plan recommends `[plans, axes, actions, sous-actions, indicateurs, mesures, documents]` — verify visually at implementation time and adjust if it reads off.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Schema move (U1) — before / after sketch

```
Before:
  packages/domain/src/search/search-document.schema.ts
    ├── PlanDocSchema       / PlanDoc
    ├── FicheDocSchema      / FicheDoc
    ├── IndicateurDocSchema / IndicateurDoc
    ├── ActionDocSchema     / ActionDoc
    └── DocumentDocSchema   / DocumentDoc

After:
  packages/domain/src/plans/fiches/axe-search-doc.schema.ts          → AxeSearchDocSchema
  packages/domain/src/plans/fiches/fiche-search-doc.schema.ts        → FicheSearchDocSchema
  packages/domain/src/indicateurs/definitions/
    indicateur-search-doc.schema.ts                                   → IndicateurSearchDocSchema
  packages/domain/src/referentiels/actions/action-search-doc.schema.ts → ActionSearchDocSchema
  packages/domain/src/collectivites/documents/
    document-search-doc.schema.ts                                     → DocumentSearchDocSchema

  (search-document.schema.ts deleted; search/index.ts barrel line removed)
```

### Field rename (U2/U3/U4) — schema + filter sketch

```
AxeSearchDocSchema {                  // was PlanDocSchema; sourced from `axe` table
  id: number,
  collectiviteId: number,        // was collectivite_id
  nom: string,
  parentId: number | null,        // was parent_id; NULL = root plan, set = sub-axe
}

FicheSearchDocSchema {
  id: number,
  titre: string,
  description: string | null,
  parentId: number | null,                      // was parent_id
  visibleCollectiviteIds: number[],             // was visible_collectivite_ids
}

IndicateurSearchDocSchema {
  id: number,
  identifiantReferentiel: string | null,         // was identifiant_referentiel
  collectiviteId: number | null,                 // was collectivite_id
  groupementId: number | null,                    // was groupement_id
  titre: string,
  titreLong: string | null,                       // was titre_long
  description: string | null,
}

ActionSearchDocSchema {
  id: string,                                     // composite primary key — UNCHANGED
  collectiviteId: number,                         // was collectivite_id
  actionId: string,                                // was action_id
  referentielId: string,                           // was referentiel_id
  type: ActionType,
  nom: string,
  description: string,
  commentaire: string | null,
}

DocumentSearchDocSchema {
  id: number,
  collectiviteId: number | null,                  // was collectivite_id
  filename: string,
}

buildTenantFilter (search.service.ts):
  plans:        `collectiviteId = ${id}`         // + planParentFilter clause from U5
  fiches base:  `visibleCollectiviteIds = ${id}`
  fiches+top:   `${base} AND parentId IS NULL`
  fiches+sous:  `${base} AND parentId IS NOT NULL`
  indicateurs:  `collectiviteId IS NULL OR collectiviteId = ${id}`
  actions:      `collectiviteId = ${id}`
  documents:    `collectiviteId IS NULL OR collectiviteId = ${id}`
```

### Plan/Axe UI (U5) — chip flow sketch

```
chip state (frontend)             →  request input            →  buildTenantFilter
─────────────────────────────────     ──────────────────────       ──────────────────────────────────────
plans=on, axes=on                  →  planParentFilter='all'    →  collectiviteId = X
plans=on, axes=off                 →  planParentFilter='root'   →  collectiviteId = X AND parentId IS NULL
plans=off, axes=on                 →  planParentFilter='axe'    →  collectiviteId = X AND parentId IS NOT NULL
plans=off, axes=off                →  plans not in enabledIndexes (bucket skipped entirely)

result list (frontend)             →  bucket slots
─────────────────────────────────     ──────────────────────────────────────────────────────
plans bucket                       →  partition by ctx.parentId →  plans:root | plans:axe
                                                                   (cosmetic split, like fiches today)

per-row badge (PrimaryBadge)       →  parentId === null ? "Plan" : "Axe"
```

---

## Implementation Units

- U1. **Move per-domain search-doc schemas into domain folders, rename `*DocSchema` → `*SearchDocSchema`**

  **Goal:** Relocate the 5 schemas from `packages/domain/src/search/search-document.schema.ts` into per-domain files; update all imports; delete the old file.

  **Requirements:** R1, R7

  **Dependencies:** None.

  **Files:**
  - Create: `packages/domain/src/plans/fiches/axe-search-doc.schema.ts` (exports `AxeSearchDocSchema` / `AxeSearchDoc` — sourced from `axe` table)
  - Create: `packages/domain/src/plans/fiches/fiche-search-doc.schema.ts` (exports `FicheSearchDocSchema` / `FicheSearchDoc`)
  - Create: `packages/domain/src/indicateurs/definitions/indicateur-search-doc.schema.ts` (exports `IndicateurSearchDocSchema` / `IndicateurSearchDoc`)
  - Create: `packages/domain/src/referentiels/actions/action-search-doc.schema.ts` (exports `ActionSearchDocSchema` / `ActionSearchDoc`)
  - Create: `packages/domain/src/collectivites/documents/document-search-doc.schema.ts` (exports `DocumentSearchDocSchema` / `DocumentSearchDoc`)
  - Modify: `packages/domain/src/plans/index.ts` (add `export * from './fiches/axe-search-doc.schema';` and `'./fiches/fiche-search-doc.schema';`)
  - Modify: `packages/domain/src/indicateurs/index.ts` (add export)
  - Modify: `packages/domain/src/referentiels/index.ts` (add export)
  - Modify: `packages/domain/src/collectivites/index.ts` (add export)
  - Modify: `packages/domain/src/search/index.ts` (remove `export * from './search-document.schema';`)
  - Delete: `packages/domain/src/search/search-document.schema.ts`
  - Modify: `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts` (line 9 import + type uses)
  - Modify: `apps/backend/src/plans/fiches/fiche-indexer/fiche-indexer.service.ts` (line 11 import + type uses)
  - Modify: `apps/backend/src/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service.ts` (line 12)
  - Modify: `apps/backend/src/referentiels/action-indexer/action-indexer.service.ts` (line 20)
  - Modify: `apps/backend/src/collectivites/documents/document-indexer/document-indexer.service.ts` (line 12)
  - Test: split or update `packages/domain/src/search/search.schema.spec.ts` — move the 5 per-doc `describe` blocks (lines 107–253) alongside their schemas as `<entity>-search-doc.schema.spec.ts` files (or keep them in the search folder if that reads cleaner — implementation-time call). The request-schema `describe` block stays in the search folder.

  **Approach:**
  - Symbol renames (hard-cut, no deprecation shim):
    - `PlanDocSchema` / `PlanDoc` → `AxeSearchDocSchema` / `AxeSearchDoc` (the only rename that changes the entity noun, because the schema is sourced from the `axe` table).
    - `FicheDocSchema` / `FicheDoc` → `FicheSearchDocSchema` / `FicheSearchDoc`.
    - `IndicateurDocSchema` / `IndicateurDoc` → `IndicateurSearchDocSchema` / `IndicateurSearchDoc`.
    - `ActionDocSchema` / `ActionDoc` → `ActionSearchDocSchema` / `ActionSearchDoc`.
    - `DocumentDocSchema` / `DocumentDoc` → `DocumentSearchDocSchema` / `DocumentSearchDoc`.
  - Field names stay snake_case in this unit. The casing migration happens in U2/U3/U4. This keeps the diff purely mechanical.
  - The header JSDoc comment ("snake_case to match the underlying table columns") stays unchanged in this unit — it gets rewritten in U2.
  - Each new file gets the same JSDoc block from the source for its schema; no content changes beyond the symbol rename and the file location. For the axe schema, the block already says "sourced from the `axe` table" — that comment now matches the symbol name.

  **Patterns to follow:**
  - File naming: `axe.schema.ts`, `bibliotheque-fichier.schema.ts`, `indicateur-definition.schema.ts` — kebab-case `<entity>-search-doc.schema.ts`.
  - Per-scope `index.ts` barrel: one `export * from './<file>';` line per file.
  - Symbol naming: PascalCase const-and-type, matching the search-folder siblings (`SearchHitSchema`, `BucketSchema`).

  **Test scenarios:**
  - Happy path: all 5 schemas validate the same example payloads they validate today (snake_case fields). Move existing fixtures verbatim.
  - Integration: `apps/backend` typechecks pass with the new import paths (`@tet/domain/plans`, `@tet/domain/indicateurs`, `@tet/domain/referentiels`, `@tet/domain/collectivites`).
  - Integration: `pnpm exec nx build domain` succeeds and emits the moved `*.d.ts` files into `packages/domain/dist/`.

  **Verification:**
  - `packages/domain/src/search/search-document.schema.ts` no longer exists.
  - 5 new files exist at the target paths above, each containing exactly one `*SearchDocSchema` + inferred type.
  - No source file references `PlanDoc`, `FicheDoc`, `IndicateurDoc`, `ActionDoc`, or `DocumentDoc` (the old type names).
  - All previously passing schema tests still pass.

---

- U2. **Convert backend write-side to camelCase: schemas, indexer transforms, and `*_INDEX_SETTINGS`**

  **Goal:** Rename every doc field from snake_case to camelCase across the 5 search-doc schemas, the 5 indexer service `toDocument` transforms (in both `indexAll` and `loadXxxDoc`), and the 5 `*_INDEX_SETTINGS` constants files.

  **Requirements:** R2, R7

  **Dependencies:** U1.

  **Files:**
  - Modify: `packages/domain/src/plans/fiches/axe-search-doc.schema.ts` (4 fields → camelCase, header JSDoc rewrite)
  - Modify: `packages/domain/src/plans/fiches/fiche-search-doc.schema.ts` (5 fields → camelCase, header JSDoc rewrite)
  - Modify: `packages/domain/src/indicateurs/definitions/indicateur-search-doc.schema.ts` (7 fields → camelCase, header JSDoc rewrite)
  - Modify: `packages/domain/src/referentiels/actions/action-search-doc.schema.ts` (7 of 8 fields → camelCase; `id` and `type` unchanged)
  - Modify: `packages/domain/src/collectivites/documents/document-search-doc.schema.ts` (3 fields → camelCase)
  - Modify: `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts` (lines 207–218, 311–336)
  - Modify: `apps/backend/src/plans/fiches/fiche-indexer/fiche-indexer.service.ts` (lines 272–281, 363–400)
  - Modify: `apps/backend/src/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service.ts` (lines 240–248, 328–359)
  - Modify: `apps/backend/src/referentiels/action-indexer/action-indexer.service.ts` (lines 448–457, 543–569, 626–649)
  - Modify: `apps/backend/src/collectivites/documents/document-indexer/document-indexer.service.ts` (lines 218–222, 308–333)
  - Modify: `apps/backend/src/plans/plans/plan-indexer/plan-index.constants.ts` (`filterableAttributes`)
  - Modify: `apps/backend/src/plans/fiches/fiche-indexer/fiche-index.constants.ts` (`filterableAttributes`)
  - Modify: `apps/backend/src/indicateurs/indicateurs/indicateur-indexer/indicateur-index.constants.ts` (`searchableAttributes` + `filterableAttributes`)
  - Modify: `apps/backend/src/referentiels/action-indexer/action-index.constants.ts` (`filterableAttributes`)
  - Modify: `apps/backend/src/collectivites/documents/document-indexer/document-index.constants.ts` (`filterableAttributes`)
  - Modify: any JSDoc inside the constants files that names old snake_case attrs (each constants file has a comment block listing the attrs).
  - Test: each indexer's e2e spec — fixtures and assertions referencing snake_case keys.

  **Approach:**
  - Schema rename strategy: for each schema, list the exact field renames in a single commit so the diff reads as a casing change rather than a redesign. Field set is otherwise unchanged.
  - Indexer transform rename: most fields already have camelCase Drizzle accessors on the source side. The change in `toDocument` is just removing the snake-casing on the right-hand-side identifier and the property name (e.g., `collectivite_id: row.collectiviteId` → `collectiviteId: row.collectiviteId`).
  - `*_INDEX_SETTINGS`: update only the casing of attribute names. The set of attributes per index is preserved 1:1.
  - Header JSDoc on each new schema file: replace the "snake_case to match the underlying table columns" comment with a note about camelCase aligning with the rest of the TS codebase.
  - Update the indexer JSDoc that names old field attributes (e.g., `fiche-index.constants.ts` lines 19–22).

  **Patterns to follow:**
  - The indexer transforms already pass through Drizzle accessors. Reuse the existing structure; only the property names change.
  - Settings calls remain untouched in shape — only the attribute literals inside the `Settings` object change.

  **Test scenarios:**
  - Happy path: each indexer's e2e spec reindexes a known seed and the resulting Meilisearch doc has camelCase keys matching the new schema. Use the schema as the assertion shape.
  - Edge case: `parentId: null` for root plans and root fiches still serializes (Zod nullable preserved). Reindex a root plan and confirm the doc has `parentId: null` (not omitted).
  - Edge case: `commentaire: null` for an action with no commentaire row still serializes correctly. The test in `action-indexer.service.e2e-spec.ts` covering this path should pass with the new key.
  - Edge case: `visibleCollectiviteIds` array is preserved with all members (owner + sharing rows). The fiche-indexer e2e spec for shared fiches should pass.
  - Edge case: action-indexer composite `id` (`'${actionId}:${collectiviteId}'`) remains a string and is unchanged.
  - Integration: `searchIndexer.bulkUpsert(...)` calls succeed against a Meilisearch instance with the new index settings (filter on the camelCase attribute names confirms they were applied).

  **Execution note:** This unit changes the wire format of every stored document. It must ship in the same release as U3 and U4. Do not deploy U2 alone.

  **Verification:**
  - `grep -rn "collectivite_id\|parent_id\|visible_collectivite_ids\|action_id\|referentiel_id\|titre_long\|identifiant_referentiel\|groupement_id" packages/domain/src/plans/fiches/axe-search-doc.schema.ts packages/domain/src/plans/fiches/fiche-search-doc.schema.ts packages/domain/src/indicateurs/definitions/indicateur-search-doc.schema.ts packages/domain/src/referentiels/actions/action-search-doc.schema.ts packages/domain/src/collectivites/documents/document-search-doc.schema.ts` returns no matches.
  - Same `grep` against the 5 indexer services + 5 constants files returns no matches.
  - Each indexer's e2e spec (5 specs) passes with camelCase fixtures.
  - Domain `search.schema.spec.ts` (or its split-up successor) passes with camelCase fixtures.

---

- U3. **Convert backend read-side proxy to camelCase: filter strings, raw-hit accessors, `contextFields` keys, `HIGHLIGHT_CROP_BY_INDEX`**

  **Goal:** Update `apps/backend/src/search/search.service.ts` so every snake_case field reference (filter strings, raw-hit accessors, contextFields output keys, highlight config) is camelCase.

  **Requirements:** R2, R7

  **Dependencies:** U2.

  **Files:**
  - Modify: `apps/backend/src/search/search.service.ts`:
    - `buildTenantFilter` lines 177–200: filter string literals.
    - `shapeHit` lines 256–365: raw-hit accessors and `contextFields` output keys.
    - `HIGHLIGHT_CROP_BY_INDEX` lines 372–396: `highlight` array entries for the indicateur index.
    - JSDoc head-of-file SECURITY block (lines 36–46) and `buildTenantFilter` JSDoc (lines 166–176) — names of snake_case attrs.
  - Test: `apps/backend/src/search/search.router.e2e-spec.ts` — `seedXxxDoc` helpers (lines 227–289), filter-literal assertions (lines 974, 1005, 1009, 1041, 1045), and "exclusive mode" / "filter injection" tests (lines 293–611). ~70 occurrences.
  - Test: `apps/backend/src/search/search-admin.router.e2e-spec.ts` — snake_case in seeded payloads + filter literals (lines 97, 104, 181, 228, 251, 267, 286).

  **Approach:**
  - `contextFields` keys output by `shapeHit` mirror the doc field names. The frontend reads these keys; the rename here MUST be coordinated with U4. Picking a different key shape for `contextFields` than the doc itself would break the convention — keep them aligned.
  - For each `shapeHit` switch case, rename: raw-hit accessors (`rawHit.parent_id` → `rawHit.parentId`), output keys (`contextFields.parent_id` → `contextFields.parentId`), and any `_formatted` accessors (`fmt.description`, `fmt.commentaire` for actions are already camelCase — those stay).
  - The "exclusive mode" tests in `search.router.e2e-spec.ts` build doc payloads and assert filter literal strings; both sides need updating.

  **Patterns to follow:**
  - `buildTenantFilter` switch structure stays identical. Only the literal field names inside backtick-template strings change.
  - `shapeHit` switch structure stays identical. Only property names change.

  **Test scenarios:**
  - Happy path: `search.router.e2e-spec.ts` "find plan by titre" returns a hit with `contextFields.parentId` populated. Same for fiche `parentId`, action `actionId` / `referentielId` / `collectiviteId`, indicateur `collectiviteId` / `identifiantReferentiel` / `titreLong`, document `collectiviteId`.
  - Edge case: the cross-collectivité tenant-isolation tests (a fiche from collectivité A is not visible to collectivité B) still pass — the camelCase `visibleCollectiviteIds = ${id}` filter is applied correctly.
  - Edge case: the `'exclusive mode'` test (only `enabledIndexes: ['plans']` returns plans bucket only) still passes after the rename.
  - Edge case: SQL-injection-style attempts in the query string (single quote, backslash) still don't escape the filter — `buildTenantFilter` only injects `${collectiviteId}` (a number), not user input. Confirm the existing injection-resistance test still passes.
  - Integration: `search-admin.router.e2e-spec.ts` rebuild tests run end-to-end (lock acquired → temp index built → swap → drop) with the camelCase doc shape.

  **Execution note:** Must ship with U2 and U4 in the same release.

  **Verification:**
  - `grep -n "collectivite_id\|parent_id\|visible_collectivite_ids\|action_id\|referentiel_id\|titre_long\|identifiant_referentiel\|groupement_id" apps/backend/src/search/search.service.ts` returns no matches.
  - Both router e2e specs pass with camelCase fixtures.

---

- U4. **Convert frontend search components to camelCase: result rows, navigation, result list partition, frontend tests**

  **Goal:** Update every frontend `contextFields[...]` access and `_formatted[...]` accessor to use camelCase keys.

  **Requirements:** R2, R7

  **Dependencies:** U3.

  **Files:**
  - Modify: `apps/app/src/search/search-result-list.tsx` line 92 — `contextFields?.['parent_id']` → `['parentId']`.
  - Modify: `apps/app/src/search/search-result-row-fiche.tsx` line 37 — `ctx['parent_id']` → `ctx['parentId']`.
  - Modify: `apps/app/src/search/search-result-row-action.tsx` lines 51, 57, 60 — `ctx['type']` (unchanged; was already case-neutral), `ctx['action_id']` → `ctx['actionId']`, `ctx['referentiel_id']` → `ctx['referentielId']`.
  - Modify: `apps/app/src/search/search-result-row-indicateur.tsx` lines 36–37 — `ctx['collectivite_id']` → `ctx['collectiviteId']`.
  - Modify: `apps/app/src/search/use-search-hit-navigation.ts` lines 52, 70, 73 — `ctx['identifiant_referentiel']` → `ctx['identifiantReferentiel']`, `ctx['action_id']` → `ctx['actionId']`, `ctx['referentiel_id']` → `ctx['referentielId']`.
  - Test: `apps/app/src/search/__tests__/search-result-rows.test.tsx` lines 108–359 — fixtures.

  **Approach:**
  - Pure key rename. No structural change to row components or navigation.
  - The `SearchHit.contextFields` TypeScript type is `Record<string, unknown>`, so the rename is silent at the type level — coverage comes from tests + e2e.

  **Patterns to follow:**
  - Same access pattern as today (`ctx?.['key']` with optional chaining). Only the literal key names change.

  **Test scenarios:**
  - Happy path: each per-row test (5 row tests) renders the row correctly with camelCase contextFields fixtures.
  - Edge case: `parentId: null` correctly identifies a top-level fiche (still rendered as "Action" not "Sous-action") — same behavior as today, just on the new key.
  - Integration: `search-result-list.tsx` partition test — given a fiches bucket with one root and one sous-action, the rendered list has `'fiches:top-level'` and `'fiches:sous-action'` sections.
  - Edge case: missing `contextFields` (legacy hit shape) still renders without crashing — same behavior as today.

  **Execution note:** Must ship with U2 and U3 in the same release.

  **Verification:**
  - `grep -rn "ctx\[.parent_id\|ctx\[.action_id\|ctx\[.referentiel_id\|ctx\[.identifiant_referentiel\|ctx\[.collectivite_id" apps/app/src/search/` returns no matches.
  - Frontend tests pass with camelCase fixtures.

---

- U5. **Surface plan-vs-axe distinction: chip, `planParentFilter`, section split, badge swap**

  **Goal:** Add an `axes` chip to the modal that filters `parentId IS NOT NULL` plan docs; add a corresponding `planParentFilter` to the request schema and `buildTenantFilter`; split the `plans` bucket into `'plans:root'` and `'plans:axe'` sections in the result list; swap the row badge between `"Plan"` and `"Axe"` based on `parentId`.

  **Requirements:** R3, R4

  **Dependencies:** U4 (frontend reads `parentId` in camelCase). Could technically land before U4 by reading `parent_id`, but coordination is cleaner if camelCase is already in place.

  **Files:**
  - Modify: `packages/domain/src/search/search-request.schema.ts` — add `planParentFilterSchema = z.enum(['all', 'root', 'axe'])`, add `planParentFilter` to `SearchRequestSchema` with `.default('all')`, export the type.
  - Modify: `apps/backend/src/search/search.service.ts`:
    - `buildTenantFilter` `case 'plans':` — compose the parentId clause based on `planParentFilter`.
    - `multiSearchInner` (around line 107) — pass `input.planParentFilter` through.
    - JSDoc on `buildTenantFilter` — document the new branch.
  - Modify: `apps/app/src/search/search-modal.tsx`:
    - `ChipKey` union — add `'axes'`.
    - `CHIPS` array — add `{ key: 'axes', label: 'Axes' }` between `plans` and `actions`.
    - `ALL_CHIPS_ENABLED` and the exclusive-mode reset object — add `axes: true` / `axes: false`.
    - `chipsToBackendInput` — `plans` index enabled when either `plans` or `axes` is on; compose `planParentFilter` from chip state.
    - `useSearchQuery` call — pass through `planParentFilter`.
  - Modify: `apps/app/src/search/use-search-query.ts` (or wherever `useSearchQuery` lives) — accept and forward `planParentFilter` to the tRPC input.
  - Modify: `apps/app/src/search/search-result-list.tsx`:
    - `BucketSlot` — add `'plans:root'` / `'plans:axe'`, remove plain `'plans'`.
    - `BUCKET_ORDER` — replace `'plans'` with `['plans:root', 'plans:axe']`.
    - `BUCKET_LABEL` — `'plans:root': 'Plans'`, `'plans:axe': 'Axes'`.
    - `flattenSearchResponse` — for plan slots, partition `buckets.plans.hits` by `contextFields.parentId` (mirror the fiches branch).
  - Modify: `apps/app/src/search/search-result-row-plan.tsx` — read `ctx['parentId']`, swap PrimaryBadge label between `"Plan"` and `"Axe"`.
  - Test: `packages/domain/src/search/search.schema.spec.ts` — add cases for `planParentFilterSchema` and the new request field.
  - Test: `apps/backend/src/search/search.router.e2e-spec.ts` — add: (a) `planParentFilter='root'` returns only top-level plans; (b) `planParentFilter='axe'` returns only sub-axes; (c) `planParentFilter='all'` returns both; (d) chip `axes`-only via `planParentFilter='axe'` end-to-end.
  - Test: `apps/app/src/search/__tests__/search-result-rows.test.tsx` — add: SearchResultRowPlan badge swaps to `"Axe"` when `ctx.parentId` is set.
  - Test: a new or extended test in the modal/result-list area — `flattenSearchResponse` partitions plans by `parentId` into `'plans:root'` and `'plans:axe'` sections.

  **Approach:**
  - Mirror the `ficheParentFilter` pattern exactly — same enum shape, same composition in `chipsToBackendInput`, same partition logic in `flattenSearchResponse`. The only meaningful difference is the enum values (`'root' | 'axe'` vs `'top-level' | 'sous-action'`).
  - Section ordering: `[plans:root, plans:axe, fiches:top-level, fiches:sous-action, indicateurs, actions, documents]` — root types first, sub-types grouped immediately after their parent.
  - Chip rendering: 7 chips total, with `axes` immediately after `plans`.
  - Backend default `planParentFilter='all'` keeps existing API consumers (any direct tRPC caller) compatible without code changes. The `enabledIndexes` array semantics are unchanged — the chip-level "neither plans nor axes" case is handled by removing `'plans'` from `enabledIndexes`, exactly mirroring how fiches handles "neither actions nor sous-actions".

  **Patterns to follow:**
  - `ficheParentFilterSchema` definition (`packages/domain/src/search/search-request.schema.ts` lines 12–17) — copy structure, swap enum values.
  - `buildTenantFilter` `case 'fiches':` (`apps/backend/src/search/search.service.ts` lines 187–196) — copy the parentId-clause composition.
  - `chipsToBackendInput` (`apps/app/src/search/search-modal.tsx` lines 54–73) — copy the dual-chip-to-filter mapping.
  - `flattenSearchResponse` fiches branch (`apps/app/src/search/search-result-list.tsx` lines 87–95) — copy the partition logic.
  - `SearchResultRowFiche` badge label swap (`apps/app/src/search/search-result-row-fiche.tsx` lines 36–53) — copy the conditional.

  **Test scenarios:**
  - Happy path: with `planParentFilter='all'`, a query matching both a root plan and a sub-axe returns both in the `plans` bucket.
  - Happy path: with `planParentFilter='root'`, the same query returns only the root plan.
  - Happy path: with `planParentFilter='axe'`, the same query returns only the sub-axe.
  - Edge case: a query that matches only sub-axes with `planParentFilter='root'` returns 0 hits in the `plans` bucket.
  - Edge case: chip state `plans=off, axes=off` removes `'plans'` from `enabledIndexes` entirely — backend never queries the index.
  - Edge case: chip state `plans=on, axes=off` produces `planParentFilter='root'`; `plans=off, axes=on` produces `planParentFilter='axe'`.
  - Edge case: exclusive-mode click on `axes` deactivates all other chips and sets `planParentFilter='axe'` (mirrors exclusive-mode click on `sous-actions` for fiches).
  - Integration (frontend): the result list renders 2 visual sections labeled `"Plans"` and `"Axes"` when both root plans and sub-axes are in the response.
  - Integration (frontend): SearchResultRowPlan with `ctx.parentId === null` renders `"Plan"` badge; with `ctx.parentId === 42` renders `"Axe"` badge.
  - Edge case: keyboard navigation (`flatHits.length` and `selectedIndex`) still works correctly when the plan bucket is split into 2 sections — verify the `startIndex` accounting in `flattenSearchResponse`.
  - Edge case: when only one of the two plan slots has hits, the empty slot is skipped (no empty section heading).

  **Verification:**
  - 7 chips render in the modal in order: Plans, Axes, Actions, Sous-actions, Indicateurs, Mesures, Documents.
  - Toggling only `axes` in the modal returns sub-axes only; the section header reads `"Axes (N)"`.
  - The backend e2e spec covers all 3 `planParentFilter` values.

---

- U6. **Update ADR 0017 to reflect schema co-location, camelCase, and plan/axe UI**

  **Goal:** Sync the architecture decision record so future readers don't see the old snake_case + consolidated-schema description as canonical.

  **Requirements:** R6

  **Dependencies:** U5.

  **Files:**
  - Modify: `doc/adr/0017-meilisearch-global-search-architecture.md`.

  **Approach:**
  - Read the current ADR and identify every section that mentions: the consolidated `search-document.schema.ts` file, snake_case field names, the chip set (5 vs 7 chips), and the fiche-only parent filter.
  - Update each section to reflect the new state.
  - Add a brief "Migration notes" appendix at the bottom referencing this plan and the rebuild runbook.

  **Patterns to follow:**
  - Keep the ADR's existing voice and structure. The work here is correction, not redesign.

  **Test scenarios:**
  - Test expectation: none — documentation-only change.

  **Verification:**
  - `grep -n "snake_case\|search-document.schema\|6 chips\|5 chips\|FicheDocSchema\|PlanDocSchema\|IndicateurDocSchema\|ActionDocSchema\|DocumentDocSchema" doc/adr/0017-meilisearch-global-search-architecture.md` returns no matches.

---

## System-Wide Impact

- **Interaction graph.** The 5 indexer services share a `OnApplicationBootstrap` lifecycle. After deploy, all 5 reapply settings to their indexes — silent overwrite if the new attribute set differs (it does, after U2). No cross-service callbacks are touched.
- **Error propagation.** No change. `MeilisearchTaskFailedError` and `classifyMeilisearchError` continue to surface task failures as `UnrecoverableError` for permanent codes and retry-able errors otherwise. The rename does not introduce any new failure modes — settings updates are idempotent and `bulkUpsert` already waits for task completion.
- **State lifecycle risks.** The biggest risk: existing snake_case docs in the indexes become un-filterable on the new camelCase attribute set immediately after deploy. **Mitigation: mandatory `'rebuild'` admin call for all 5 entities post-deploy. Document this in the rollout note.** The `'rebuild'` flow uses Redis SETNX locks so concurrent runs are safe; the swap-and-drop is atomic per entity.
- **API surface parity.** `SearchRequestSchema` gains `planParentFilter` (defaulted to `'all'`) — backwards-compatible for any direct tRPC consumer. The 5 schemas in `@tet/domain` change import paths and symbol names — every consumer is in this monorepo and is updated as part of U1; no external consumers exist.
- **Integration coverage.** Two layers of test coverage exist today: domain schema specs (Zod validation) and backend e2e specs (real Meilisearch). The camelCase rename touches both. Make sure the e2e specs run against a Meilisearch instance with **fresh** indexes — running U2/U3 against an instance that already has snake_case docs in it would mask the migration risk.
- **Unchanged invariants.**
  - Index names (`plans`, `fiches`, `indicateurs`, `actions`, `documents`) are unchanged.
  - The `actions` composite primary key (`'${actionId}:${collectiviteId}'`) is unchanged.
  - The `SearchHitType` enum (`'plan' | 'fiche' | 'indicateur' | 'action' | 'document'`) is unchanged.
  - Tenant-isolation guarantees are unchanged: every query still filters by `collectiviteId` (or `visibleCollectiviteIds`); the rename is mechanical.
  - The `'upsert'` admin mode still exists — but is **insufficient** for this migration. Operators must use `'rebuild'`.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Search silently returns 0 hits in production after deploy if the operator forgets to run `reindex { mode: 'rebuild' }` for all 5 entities | (a) Document the rollout sequence in this plan + ADR. (b) The 5 admin endpoints are already exposed and idempotent. (c) The `'rebuild'` flow is fast (temp index + swap) — under 5 minutes per entity for typical data sizes. (d) Consider adding a one-shot `reindexAll` admin endpoint that fans out to all 5 — implementation-time call, not in scope here |
| Partial rollout (U2 ships without U3 or U4 due to a botched cherry-pick) leaves the system half-converted and broken | The plan units are decomposed for review clarity but the units explicitly state "must ship with the others in the same release". `ce-work` should bundle U2 + U3 + U4 into one PR even if commits are split |
| Schema move (U1) silently breaks a frontend component that imports a doc type from `@tet/domain/search` | The 5 type imports are enumerated in U1's `Files:` list. After the move, run `pnpm exec tsc --noEmit` across the affected packages to catch any missed reference. Frontend currently does not import these schema types directly — only `SearchHit`, `Bucket`, `SearchResponse` from `@tet/domain/search`, all of which stay in the search folder |
| The `axes` chip placement disrupts established muscle memory (operators used to "Plans" being the first chip) | The chip array order keeps `Plans` first, `Axes` second — discovery cost is one extra chip in the same row. If the team prefers the reverse, easy to flip in U5 — implementation-time aesthetic choice |
| `search-admin.router.e2e-spec.ts` `rebuild` tests run with a stale index between tests, masking the bug | Each test uses a fresh tempIndex name (per `rebuildEntity`), and the lock is per-entity. The test isolation pattern from `doc/solutions/test-failures/parallel-e2e-test-isolation.md` is already followed (per-test prefix). Confirm during U2's e2e updates |
| The `'plan' \| 'axe'` chip exclusive-mode interaction differs subtly from `'actions' \| 'sous-actions'` because of the chip positions | Mirror `chipsToBackendInput` exactly — the exclusive-mode handler in `handleChipClick` already sets all chips to `false` then activates the clicked one. No special-case logic needed |
| ADR 0017 update slips and stays stale if it's a separate PR | Make U6 part of the same PR as U5 so the ADR ships with the user-facing behavior change |

---

## Documentation / Operational Notes

### Rollout sequence (mandatory)

After deploy of U2 + U3 + U4:

1. Verify `ensureIndexSettings` ran cleanly on boot for all 5 indexes (logs: `[<IndexerService>] Index settings applied`).
2. Run the admin rebuild for each entity, sequentially or in parallel (5 separate Redis locks):
   - `search.admin.reindexPlans { mode: 'rebuild' }`
   - `search.admin.reindexFiches { mode: 'rebuild' }`
   - `search.admin.reindexIndicateurs { mode: 'rebuild' }`
   - `search.admin.reindexActions { mode: 'rebuild' }`
   - `search.admin.reindexDocuments { mode: 'rebuild' }`
3. Verify each call returned `{ indexedCount > 0, mode: 'rebuild' }` and the swap completed.
4. Smoke-test the modal: open ⌘K, query a known plan name + a known fiche title + a known indicateur title — confirm hits in each bucket.

If step 4 fails for any entity, that entity's rebuild was not run or did not complete. Re-run the relevant admin call.

### Solutions doc to capture after this lands

- `doc/solutions/architecture-patterns/meilisearch-index-rename-runbook.md` — the rollout sequence above plus rationale for `'rebuild'` over `'upsert'`. This is the kind of operational knowledge that gets re-discovered painfully if undocumented.

---

## Sources & References

- **Existing ADR:** [`doc/adr/0017-meilisearch-global-search-architecture.md`](../adr/0017-meilisearch-global-search-architecture.md) — current architecture description (will be updated in U6).
- **Prior plan:** [`doc/plans/2026-04-27-002-feat-meilisearch-global-search-plan.md`](2026-04-27-002-feat-meilisearch-global-search-plan.md) — the original 12-unit feature plan that established the snake_case + consolidated schemas.
- **Prior plan:** [`doc/plans/2026-04-28-002-refactor-per-domain-index-bootstrap-plan.md`](2026-04-28-002-refactor-per-domain-index-bootstrap-plan.md) — established the per-domain `OnApplicationBootstrap` pattern this refactor relies on.
- **Conventions ADR:** [`doc/adr/0003-conventions-de-code.md`](../adr/0003-conventions-de-code.md) — file naming, kebab-case, schema suffix conventions.
- **Related code (not exhaustive):**
  - `packages/domain/src/search/` (search-folder schemas + spec, request schema)
  - `apps/backend/src/utils/search-indexer/search-indexer.service.ts` (SDK wrapper, idempotent settings)
  - `apps/backend/src/search/search.service.ts` (read-side proxy)
  - `apps/backend/src/search/search-admin.service.ts` (rebuild flow)
  - `apps/app/src/search/` (modal, result list, row components, navigation)
