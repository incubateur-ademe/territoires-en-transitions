---
title: "refactor: derive search-doc schemas from canonical domain schemas"
type: refactor
status: active
date: 2026-05-04
---

# refactor: derive search-doc schemas from canonical domain schemas

## Overview

Today, each `*SearchDocSchema` in `packages/domain/src/<domain>/<entity>-search-doc.schema.ts` is a hand-written Zod object literal that duplicates the field shape of its source domain schema (`axeTableSchema`, `ficheSchema`, `indicateurDefinitionSchema`, `actionDefinitionSchema` × `actionCommentaireSchema`, `bibliothequeFichierSchema`). The duplication invites drift: a domain rename or type tweak doesn't propagate, and the search-doc silently keeps an outdated shape.

This refactor rebases every `*SearchDocSchema` on its canonical domain schema using Zod composition (`z.pick(domainSchema, {...})` for the bulk, plus `z.extend(...)` for synthesized or type-narrowing fields). Single source of truth: search docs become explicit projections of domain entities rather than parallel definitions.

The Axe schema's domain accessors are `parent` and `plan` (single-word DB columns kept verbatim by Drizzle), not `parentId` / `planId`. Aligning the search-doc to its source therefore renames two fields:

  AxeSearchDoc.parentId → parent
  AxeSearchDoc.planId   → plan

Every other entity already shares its name set with its domain schema — Indicateur is a clean `pick`, Fiche needs only an `extend` for the synthesized `visibleCollectiviteIds`, Document needs only a nullability widen on `collectiviteId`, Action picks from two domain schemas plus extends with `id` (composite) and `type` (synthesized). No other wire-shape rename is forced.

The Axe rename means another doc-shape change for the `plans` Meilisearch index (filterableAttributes literals, `buildTenantFilter` strings, `contextFields` keys, frontend accessors). Same silent-failure mode as the prior camelCase migration if the post-deploy rebuild is skipped — but scoped to one index this time, not five.

---

## Problem Frame

The 5 search-doc schemas were hand-written as part of the original Meilisearch feature (plan `2026-04-27-002`) and the U1 split-by-domain refactor (plan `2026-05-04-001`). At the time, deriving from the canonical domain schemas would have entangled the search-doc creation with two questions that the team chose to defer:

- Whether the domain table schemas were stable enough to project from (some had `.default()` chains that historically caused subtle bugs — see `doc/solutions/logic-errors/zod-default-leaks-into-partial-update-schema.md`).
- Whether search-doc field names should match domain accessors or carry a search-feature naming convention (`planId`/`parentId` vs `plan`/`parent`).

Both questions are now resolvable. Local research confirms:

- **None** of the 5 candidate domain schemas carry `.default(...)` on any field consumed by the corresponding search-doc. The `default-leaks-into-partial` failure mode does not apply to this refactor's specific bases.
- The team's preference (per the user's request) is for search-doc field names to match the domain accessor names. That forces the Axe rename but no others.

Two structural surprises emerged from the research:

- `axeTableSchema` (the table-shaped schema for the `axe` table, separate from `axeSchema` which extends with the `axes` array and `type` relation) is **file-private** in `packages/domain/src/plans/fiches/axe.schema.ts`. Exporting it is a precondition.
- 4 of the 5 candidate domain schemas use **`zod/mini`** (`import * as z from 'zod/mini'`); only `ficheSchema` and `bibliothequeFichierSchema` use full Zod. Composition methods differ between the two flavors but interop is fine within a single search-doc file (`z.pick(miniSchema, {...})` works alongside `fullSchema.pick({...})`). The repo already has many examples (e.g., `packages/domain/src/referentiels/scores/score-snapshot-action-scores-payload.schema.ts` calls `z.pick(actionDefinitionSchema, {...})` — same pattern this plan adopts).

---

## Requirements Trace

- **R1.** Each `*SearchDocSchema` is built by composing a `z.pick(...)` of its canonical domain schema, plus `z.extend(...)` only for fields that are synthesized at index time or that need type tightening (e.g., non-null where the domain is nullable).
- **R2.** Search-doc field names match the domain schema's accessor names. The Axe schema's `parentId` and `planId` are renamed to `parent` and `plan` to align with `axeTableSchema.parent` and `axeTableSchema.plan`.
- **R3.** No new fields are added to any search-doc; the wire shape per entity is preserved 1:1 except for the Axe rename and any deliberate nullability adjustments that are explicitly called out as decisions.
- **R4.** `axeTableSchema` is exported from `packages/domain/src/plans/fiches/axe.schema.ts` so consumers (the new `AxeSearchDocSchema` derivation, future projections) can pick from it.
- **R5.** All downstream consumers of the renamed Axe fields are updated in lockstep: indexer transforms, `*_INDEX_SETTINGS` filterableAttributes, the read-side proxy's `buildTenantFilter` and `shapeHit`, frontend `contextFields` accessors, and tests at every layer.
- **R6.** The mandatory rebuild runbook is documented for the Axe rename (rebuild only the `plans` index post-deploy; the other 4 indexes are wire-shape-stable).
- **R7.** ADR 0017 (`doc/adr/0017-meilisearch-global-search-architecture.md`) reflects the new derivation pattern, the `parent`/`plan` rename, and the runbook update.

---

## Scope Boundaries

- The Action search doc continues to source from **two** domain schemas (`actionDefinitionSchema` for definition fields, `actionCommentaireSchema` for the commentaire join). Combining them into one canonical `ActionWithCommentaire` domain schema is out of scope.
- The synthesized fields (`AxeSearchDoc.plan` overriding the nullable domain `plan` with a non-null `axe.plan ?? axe.id`, `FicheSearchDoc.visibleCollectiviteIds`, `ActionSearchDoc.id` composite, `ActionSearchDoc.type` from `actionTypeSchema`) stay synthesized — this refactor doesn't try to push them into the domain.
- Domain schema changes outside of `axeTableSchema` export are out of scope. If implementation reveals that `bibliothequeFichierSchema.collectiviteId` should be nullable (to match the search-doc's claim that null = global file), that fix is noted as a deferred question — not bundled here.
- The `nom` field on Axe is nullable in the domain (`axeTableSchema.nom: z.nullable(z.string())`) but is treated as non-null in the search-doc because the indexer skips axes with `nom IS NULL`. The refactor preserves the strict non-null contract via `.extend({ nom: z.string() })`. Same for `FicheSearchDoc.titre`: the indexer falls back to `'Nouvelle action'` when null, and the search-doc keeps the strict non-null contract.
- The `.max(300)` and `.max(20000)` validators on `ficheSchema.titre` / `description` will survive `.pick()` into the derived `FicheSearchDocSchema`. This is acceptable — they're additive validation, harmless on read, and a useful guard against malformed seed data in tests.
- No changes to `ficheSchemaCreate` / `ficheSchemaUpdate` or any other consumer of `ficheSchema`. The pick is purely additive.

### Deferred to Follow-Up Work

- **Confirm `bibliothequeFichierSchema.collectiviteId` nullability against the actual `bibliotheque_fichier` table.** If the column is nullable, the domain schema is wrong and should be fixed; the search-doc would then become a clean pick. If non-null, the search-doc's "null = global file" claim is wrong and should be tightened. Either way it's a discovery worth doing — but as a separate change so this refactor stays focused.
- **Capture this refactor's outcome via `/ce-compound`** afterward. Two `doc/solutions/` gaps stand out: Zod composition gotchas (none documented) and Meilisearch index-rename runbooks (none documented). This refactor is the second rename in two weeks; documenting the rebuild sequence prevents re-discovery cost on the next one.

---

## Context & Research

### Relevant Code and Patterns

- **Search-doc files (refactor targets):**
  - `packages/domain/src/plans/fiches/axe-search-doc.schema.ts`
  - `packages/domain/src/plans/fiches/fiche-search-doc.schema.ts`
  - `packages/domain/src/indicateurs/definitions/indicateur-search-doc.schema.ts`
  - `packages/domain/src/referentiels/actions/action-search-doc.schema.ts`
  - `packages/domain/src/collectivites/documents/document-search-doc.schema.ts`
- **Canonical domain schemas (sources):**
  - `packages/domain/src/plans/fiches/axe.schema.ts` — exports `axeSchema` (line 34); `axeTableSchema` (lines 4–16) is **file-private** and must be exported.
  - `packages/domain/src/plans/fiches/fiche.schema.ts` — exports `ficheSchema` (lines 32–97), full Zod.
  - `packages/domain/src/indicateurs/definitions/indicateur-definition.schema.ts` — exports `indicateurDefinitionSchema` (lines 3–27), zod/mini.
  - `packages/domain/src/referentiels/actions/action-definition.schema.ts` — exports `actionDefinitionSchema` (lines 12–31), zod/mini.
  - `packages/domain/src/referentiels/actions/action-commentaire.schema.ts` — exports `actionCommentaireSchema` (lines 3–9), zod/mini.
  - `packages/domain/src/collectivites/documents/bibliotheque-fichier.schema.ts` — exports `bibliothequeFichierSchema` (lines 3–9), full Zod.
  - `packages/domain/src/referentiels/actions/action-type.enum.ts` — exports `actionTypeSchema` for the synthesized `ActionSearchDoc.type` field.
- **Existing Zod composition patterns to mirror** (multiple precedents in the repo):
  - `z.pick(miniSchema, {...})` — `packages/domain/src/indicateurs/definitions/indicateur-definition.schema.ts:57–69` (defines `indicateurDefinitionSchemaTiny`).
  - `z.pick(miniSchema, {...})` from a full-Zod consumer — `packages/domain/src/referentiels/scores/score-snapshot-action-scores-payload.schema.ts:13`.
  - `fullSchema.pick({...})` — `packages/domain/src/collectivites/collectivite.schema.ts:32` (defines `collectiviteResumeSchema`).
  - `fullSchema.pick({...})` for sharing-create projection — `packages/domain/src/plans/fiches/fiche-sharing.schema.ts:12`.
  - `z.extend(z.pick(s, {...}), {...})` (the exact compose form this refactor uses) — `packages/domain/src/collectivites/documents/preuve-audit-with-fichier.schema.ts:7–9`.
  - `fullSchema.extend({...})` — `packages/domain/src/plans/fiches/fiche.schema.ts:146` (defines `ficheWithRelationsSchema`).
- **Downstream consumers of the Axe rename:**
  - `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts` — `indexAll()` and `loadPlanDoc()` transforms emit `parentId`/`planId`.
  - `apps/backend/src/plans/plans/plan-indexer/plan-index.constants.ts` — `PLAN_INDEX_SETTINGS.filterableAttributes: ['collectiviteId', 'parentId']`.
  - `apps/backend/src/search/search.service.ts` — `buildTenantFilter` for `'plans'` (the U5 plan-parent-filter branch references `parentId`), and `shapeHit` for the `'plans'` case (emits `contextFields.parentId` and `contextFields.planId`).
  - `apps/app/src/search/search-result-list.tsx` — partition reads `h.contextFields?.['parentId']` to split `plans:root` / `plans:axe`.
  - `apps/app/src/search/search-result-row-plan.tsx` — badge swap reads `ctx['parentId']`.
  - `apps/app/src/search/use-search-hit-navigation.ts` — `'plan'` case reads `ctx['planId']`.
  - Tests: `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.e2e-spec.ts`, the plan-related blocks of `apps/backend/src/search/search.router.e2e-spec.ts`, and `apps/app/src/search/__tests__/search-result-rows.test.tsx`.
- **Repo-wide convention for composing schemas with both Zod flavors:** When the source domain schema is `zod/mini`, use `z.pick(domainSchema, {...})` in the search-doc file (which itself imports full Zod). When the source is full Zod, both `domainSchema.pick({...})` and `z.pick(domainSchema, {...})` work — pick whichever reads cleaner for the file.

### Institutional Learnings

- **`doc/solutions/logic-errors/zod-default-leaks-into-partial-update-schema.md`** — `.default(...)` on a base schema survives `.partial()` / `.pick()`. **Confirmed not applicable to this refactor's specific bases**: none of the 5 candidate domain schemas carry `.default(...)` on any field consumed by the corresponding search-doc. The risk is zero for this work, but the recommendation in the learning still stands as a forward-looking guard: if a future refactor adds `.default()` on a domain schema field that flows into a search-doc, the picked schema will inherit it. Mitigation if that ever happens: `.omit()` and redeclare the bare shape, or extract a no-defaults base schema both sides derive from.
- **No prior `doc/solutions/` learning** on Meilisearch index migrations or domain-package projection conventions. ADR 0017 is the closest reference. Worth filing a `/ce-compound` learning after this lands — see Scope Boundaries.

### External References

External research was skipped — local patterns are dense (multiple recent precedents for every composition operator used here, plus the `zod/mini` interop pattern is already in use in the repo). The Zod composition behavior needed by this refactor is well-documented in the Zod docs but already idiomatic in the codebase.

---

## Key Technical Decisions

- **Use the `z.pick(domainSchema, {...})` form universally**, even for the two full-Zod sources (`ficheSchema`, `bibliothequeFichierSchema`). Reason: every search-doc file ends up calling at least one `z.pick`/`z.extend` against a `zod/mini` schema (because Indicateur, Action × 2, and Axe sources are mini), so the file-level convention has to support that flavor. Keeping the same form for the two full-Zod sources avoids mixing conventions within one file. The full-Zod schemas accept the namespace-form call without issue (precedent: `score-snapshot-action-scores-payload.schema.ts`).
- **Export `axeTableSchema` from `axe.schema.ts`.** The schema is currently file-private. Exposing the table shape (without the `axes` array + `type` relation that `axeSchema` adds) is the right primitive for projections, and matches the pattern of having both a "table" and a "with relations" schema seen elsewhere in the domain package. This is the cleanest fix; the alternative (`axeSchema.pick({...}).omit({axes: true, type: true})`) is uglier and doesn't reflect intent.
- **Preserve the strict non-null contract on `AxeSearchDoc.nom` and `FicheSearchDoc.titre`** via `.extend({ nom: z.string() })` / `.extend({ titre: z.string() })` overrides. Both are nullable in their domain schemas. The picked sub-schema would inherit the nullability, but the indexers already guarantee non-null at index time (skip-on-null for axes, fallback-to-`'Nouvelle action'` for fiches). Tightening the search-doc back to non-null preserves the read-side contract that proxy and frontend depend on. The cost is one extra extend line per schema.
- **Override `AxeSearchDoc.plan` to non-null** via `.extend({ plan: z.number().int() })`. Domain `plan` is nullable (root plans have `plan IS NULL` until back-filled), but the search-doc's `plan` is synthesized at index time as `axe.plan ?? axe.id` — so it's always a number. The override makes the synthesis explicit at the schema layer.
- **Widen `DocumentSearchDoc.collectiviteId` to nullable** via `.extend({ collectiviteId: z.number().int().nullable() })`. Domain says non-null; search-doc says nullable to model "global / system file". This is a known divergence that the refactor preserves (and flags for follow-up: see Deferred to Follow-Up Work).
- **Widen `ActionSearchDoc.commentaire` to nullable** via `.extend({ commentaire: z.string().nullable() })`. Domain `actionCommentaireSchema.commentaire` is non-null; the search-doc indexer LEFT-JOINs and gets `null` when no comment row exists. Same pattern as Document.
- **Do not bundle the Action `id` and `type` synthesis differently** — both are clearly extends, not picks. `ActionSearchDoc.id` is a composite string (`'${actionId}:${collectiviteId}'`) computed at index time; `ActionSearchDoc.type` comes from `actionTypeSchema` (separate file from the action-definition schema). Both stay as extends. This means `ActionSearchDocSchema` looks like: `z.extend(z.pick(actionDefinitionSchema, {actionId, referentielId, nom, description}), { id, collectiviteId, type, commentaire })`.
- **`parentId → parent` and `planId → plan` for Axe** match the user's stated preference and the domain accessor convention. Single-word DB columns (`parent`, `plan`) stay verbatim in the domain schema; only multi-word columns get camelCased (`collectiviteId`, `typeId`, `panierId`). Aligning the search-doc to this rule is the whole point.
- **Scope the post-deploy rebuild to the `plans` index only.** The other 4 entities have wire-shape-identical projections after derivation (their domain accessor names already match the search-doc names). Only `plans` carries the rename. The runbook is one admin call: `search.admin.reindexPlans { mode: 'rebuild' }`.

---

## Open Questions

### Resolved During Planning

- **Where does the Axe rename need to land for shape stability?** → Two doc fields (`parent`, `plan`) on the `plans` index. All other indexes are stable.
- **Will any `.default()` chain survive `.pick()` into a derived search-doc?** → No. Local research confirmed none of the 5 source domain schemas carry `.default(...)` on the relevant fields. (Forward guard documented in Institutional Learnings.)
- **What about the type-narrowing on `nom` / `titre` (non-null in search-doc, nullable in domain)?** → Preserve the strict contract via `.extend({nom: z.string()})` / `.extend({titre: z.string()})` overrides. Indexer-side guarantees make the strictness safe at runtime.
- **Should the synthesized `AxeSearchDoc.plan` be derived from the (nullable) domain `plan` or overridden?** → Override to non-null (`.extend({plan: z.number().int()})`). The synthesis (`axe.plan ?? axe.id`) is what makes it always present.
- **Compose with `.pick()`+`.extend()`-namespace-form or instance-method form?** → Namespace form (`z.pick(...)`, `z.extend(...)`) for all 5 search-docs, since 4 of 5 sources are `zod/mini` and the convention has to support both. Precedent in the repo: `score-snapshot-action-scores-payload.schema.ts:13`.

### Deferred to Implementation

- **`bibliothequeFichierSchema.collectiviteId` actual nullability against the DB.** The refactor preserves the search-doc's nullable claim. Verifying which side is wrong is out of scope here — see the follow-up note in Scope Boundaries.
- **Whether to also update `seedPlanDoc` test helpers in the indexer e2e spec to reflect the rename.** Almost certainly yes — but the exact shape of the helper change is mechanical and clearer at implementation time once the schema is in place.
- **Whether the `.max(300)` / `.max(20000)` chains on `ficheSchema.titre`/`description` cause any e2e test regression** when picked into `FicheSearchDocSchema`. Both validators are already enforced upstream in the indexer (the Drizzle column has the same limit) so it shouldn't matter. Confirm at implementation time by running the affected specs.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
Before                                        After
─────────────────────────────────────────     ─────────────────────────────────────────────────
AxeSearchDocSchema = z.object({               AxeSearchDocSchema = z.extend(
  id: z.number().int(),                         z.pick(axeTableSchema, {
  collectiviteId: z.number().int(),               id: true, collectiviteId: true,
  nom: z.string(),                                nom: true, parent: true,
  parentId: z.number().int().nullable(),        }),
  planId: z.number().int(),                     {
})                                                nom: z.string(),                  // strict
                                                  plan: z.number().int(),           // non-null
                                                }
                                              )

FicheSearchDocSchema = z.object({             FicheSearchDocSchema = z.extend(
  id: z.number().int(),                         z.pick(ficheSchema, {
  titre: z.string(),                              id: true, titre: true,
  description: z.string().nullable(),             description: true, parentId: true,
  parentId: z.number().int().nullable(),        }),
  visibleCollectiviteIds: z.array(...),         {
})                                                titre: z.string(),                // strict
                                                  visibleCollectiviteIds:
                                                    z.array(z.number().int()),      // synth
                                                }
                                              )

IndicateurSearchDocSchema = z.object({        IndicateurSearchDocSchema = z.pick(
  id, identifiantReferentiel,                   indicateurDefinitionSchema,
  collectiviteId, groupementId,                 { id, identifiantReferentiel,
  titre, titreLong, description                   collectiviteId, groupementId,
})                                                titre, titreLong, description }
                                              )                                     // pure pick

ActionSearchDocSchema = z.object({            ActionSearchDocSchema = z.extend(
  id: z.string(),                               z.pick(actionDefinitionSchema, {
  collectiviteId, actionId,                       actionId: true, referentielId: true,
  referentielId, type,                            nom: true, description: true,
  nom, description,                             }),
  commentaire: z.string().nullable(),           {
})                                                id: z.string(),                   // synth
                                                  collectiviteId: z.number().int(),
                                                  type: actionTypeSchema,           // synth
                                                  commentaire: z.string().nullable(), // widen
                                                }
                                              )

DocumentSearchDocSchema = z.object({          DocumentSearchDocSchema = z.extend(
  id, collectiviteId (nullable),                z.pick(bibliothequeFichierSchema,
  filename                                      { id: true, filename: true }),
})                                              { collectiviteId: z.number().int().nullable() }
                                              )                                     // widen
```

Field-level rename map for the Axe wire shape:

```
AxeSearchDoc field   |  Was         |  Becomes  |  Source
────────────────────────────────────────────────────────────────────────────────
id                   |  id          |  id       |  axeTableSchema.id
collectiviteId       |  collectiviteId | (same) |  axeTableSchema.collectiviteId
nom                  |  nom         |  nom      |  axeTableSchema.nom (overridden non-null)
parent               |  parentId    |  parent   |  axeTableSchema.parent  ← RENAME
plan                 |  planId      |  plan     |  axeTableSchema.plan (overridden non-null) ← RENAME
```

Filter / accessor ripple for the rename (plans index only):

```
Layer                              |  Before                          |  After
─────────────────────────────────────────────────────────────────────────────────────────
buildTenantFilter('plans', root)   |  collectiviteId = ${id}          |  (unchanged)
                                   |  AND parentId IS NULL            |  AND parent IS NULL
buildTenantFilter('plans', axe)    |  AND parentId IS NOT NULL        |  AND parent IS NOT NULL
PLAN_INDEX_SETTINGS.filterable     |  ['collectiviteId', 'parentId']  |  ['collectiviteId', 'parent']
shapeHit('plans').contextFields    |  parentId, planId, collectiviteId|  parent, plan, collectiviteId
search-result-list partition       |  h.contextFields?.['parentId']   |  h.contextFields?.['parent']
search-result-row-plan badge       |  ctx['parentId']                 |  ctx['parent']
use-search-hit-navigation 'plan'   |  ctx['planId']                   |  ctx['plan']
```

---

## Implementation Units

- U1. **Export `axeTableSchema` from the domain package**

  **Goal:** Make the table-shaped Axe schema importable so the new `AxeSearchDocSchema` can pick from it.

  **Requirements:** R4

  **Dependencies:** None.

  **Files:**
  - Modify: `packages/domain/src/plans/fiches/axe.schema.ts` (add `export` keyword to `axeTableSchema` declaration; barrel `index.ts` already re-exports from this file via `export * from './fiches/axe.schema'`).

  **Approach:**
  - Single-keyword change. The schema definition is unchanged; only its visibility flips from file-private to exported.
  - No barrel change needed — `packages/domain/src/plans/index.ts` already re-exports everything from `fiches/axe.schema`.

  **Patterns to follow:**
  - The pattern of having both a "table" and a "with relations" schema is already present in the file (`axeTableSchema` for the bare table, `axeSchema` for the table + relations). This change just stops hiding the more primitive of the two.

  **Test scenarios:**
  - Test expectation: none — pure export visibility change.

  **Verification:**
  - `import { axeTableSchema } from '@tet/domain/plans'` resolves at type level.
  - `pnpm exec nx build domain` succeeds and `axeTableSchema` is present in the emitted `dist/plans/fiches/axe.schema.d.ts`.

---

- U2. **Refactor the 5 `*SearchDocSchema` files to derive from domain schemas**

  **Goal:** Replace the hand-written object literals with `z.pick(...)` / `z.extend(...)` compositions against the canonical domain schemas. Apply the Axe field rename (`parentId → parent`, `planId → plan`) at the schema layer.

  **Requirements:** R1, R2, R3, R7

  **Dependencies:** U1.

  **Files:**
  - Modify: `packages/domain/src/plans/fiches/axe-search-doc.schema.ts`
  - Modify: `packages/domain/src/plans/fiches/fiche-search-doc.schema.ts`
  - Modify: `packages/domain/src/indicateurs/definitions/indicateur-search-doc.schema.ts`
  - Modify: `packages/domain/src/referentiels/actions/action-search-doc.schema.ts`
  - Modify: `packages/domain/src/collectivites/documents/document-search-doc.schema.ts`
  - Modify: `packages/domain/src/plans/fiches/axe-search-doc.schema.spec.ts` (rename `parentId → parent` and `planId → plan` in fixtures)
  - Test: `packages/domain/src/plans/fiches/fiche-search-doc.schema.spec.ts` (likely no fixture change — `parentId` already matches; just verify all assertions still pass)
  - Test: `packages/domain/src/indicateurs/definitions/indicateur-search-doc.schema.spec.ts` (no fixture change expected — pure pick)
  - Test: `packages/domain/src/referentiels/actions/action-search-doc.schema.spec.ts` (no fixture change expected — names match)
  - Test: `packages/domain/src/collectivites/documents/document-search-doc.schema.spec.ts` (no fixture change expected — names match)

  **Approach:**
  - Use the namespace form `z.pick(domainSchema, {...})` + `z.extend(...)` for all 5 schemas. Same convention regardless of source flavor (zod/mini for Axe / Indicateur / Action; full Zod for Fiche / Document).
  - Per-schema composition (per the High-Level Technical Design sketch above):
    - **Axe**: pick `id, collectiviteId, nom, parent` from `axeTableSchema`; extend with strict non-null `nom: z.string()` and synthesized non-null `plan: z.number().int()`.
    - **Fiche**: pick `id, titre, description, parentId` from `ficheSchema`; extend with strict non-null `titre: z.string()` and synthesized `visibleCollectiviteIds: z.array(z.number().int())`.
    - **Indicateur**: pure pick `id, identifiantReferentiel, collectiviteId, groupementId, titre, titreLong, description` from `indicateurDefinitionSchema`. No extend needed.
    - **Action**: pick `actionId, referentielId, nom, description` from `actionDefinitionSchema`; extend with synthesized `id: z.string()` (composite), `collectiviteId: z.number().int()`, `type: actionTypeSchema` (from `./action-type.enum`), `commentaire: z.string().nullable()` (widened from non-null domain).
    - **Document**: pick `id, filename` from `bibliothequeFichierSchema`; extend with widened `collectiviteId: z.number().int().nullable()`.
  - Update each file's header JSDoc to explain the derivation pattern (e.g., "AxeSearchDocSchema — projection of `axeTableSchema` for the global ⌘K modal. Field names match the domain accessors (`parent`, `plan`) so the schemas stay in sync as the Axe shape evolves.").
  - Update the `AxeSearchDocSchema` spec fixtures: `parentId` → `parent`, `planId` → `plan`, in all three test cases.

  **Patterns to follow:**
  - `packages/domain/src/referentiels/scores/score-snapshot-action-scores-payload.schema.ts:13` for `z.pick` from a `zod/mini` source.
  - `packages/domain/src/collectivites/documents/preuve-audit-with-fichier.schema.ts:7–9` for the `z.extend(z.pick(s, {...}), {...})` compound form.
  - `packages/domain/src/plans/fiches/fiche-sharing.schema.ts:12` for a clean `z.pick` projection.

  **Test scenarios:**
  - Happy path: each derived `*SearchDocSchema` validates the same example payloads that the prior hand-written schemas validated, with field renames applied for `AxeSearchDoc` only.
  - Edge case: `AxeSearchDocSchema` rejects a payload with `parentId` (the old name) and accepts `parent`. Same for `planId` → `plan`.
  - Edge case: `AxeSearchDocSchema` rejects a payload missing `plan` (synthesis must be enforced — non-null override).
  - Edge case: `AxeSearchDocSchema` rejects a payload missing `nom` or with `nom: null` (strict non-null override).
  - Edge case: `FicheSearchDocSchema` rejects a payload with `titre: null` (strict non-null override).
  - Edge case: `FicheSearchDocSchema` rejects a payload missing `visibleCollectiviteIds` (still required after the extend).
  - Edge case: `DocumentSearchDocSchema` accepts `collectiviteId: null` (the widening preserves the global-file case).
  - Edge case: `ActionSearchDocSchema` accepts `commentaire: null` (the widening preserves the no-comment case).

  **Verification:**
  - All 5 schema spec files pass.
  - `grep -rn "parentId\|planId" packages/domain/src/plans/fiches/axe-search-doc.schema.ts packages/domain/src/plans/fiches/axe-search-doc.schema.spec.ts` returns no matches.
  - `pnpm exec nx build domain` succeeds; the dist `.d.ts` for each search-doc derives its `<Entity>SearchDoc` type via the inferred composition (compatible with the prior shape, modulo the Axe rename).
  - Backend `tsc --noEmit -p apps/backend/tsconfig.app.json` passes (will surface anywhere that consumed `AxeSearchDoc.parentId` / `.planId` as a typed property — those become U3 / U4 work).

---

- U3. **Update plan-indexer transforms and `PLAN_INDEX_SETTINGS` for the Axe rename**

  **Goal:** Make the indexer emit `parent`/`plan` instead of `parentId`/`planId` and reflect the rename in the index settings.

  **Requirements:** R5

  **Dependencies:** U2.

  **Files:**
  - Modify: `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts` (the `indexAll()` push and `loadPlanDoc()` return literal both rename `parentId → parent`, `planId → plan`).
  - Modify: `apps/backend/src/plans/plans/plan-indexer/plan-index.constants.ts` (`filterableAttributes: ['collectiviteId', 'parentId']` → `['collectiviteId', 'parent']`).
  - Test: `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.e2e-spec.ts` (any inline hit-shape annotation or fixture using `parentId`/`planId` keys gets renamed; the `seedPlanDoc` helper in `search.router.e2e-spec.ts` is U4's responsibility but if the indexer e2e spec has its own fixture builder, it's renamed here).

  **Approach:**
  - Mechanical rename on the LHS of the document literals (`parent_id: row.parent` → `parent: row.parent`, etc. — except we already use camelCase, so it's `parentId: row.parent` → `parent: row.parent`).
  - The Drizzle accessor on the right-hand-side stays unchanged (`row.parent`, `row.plan`) — those already match the column names.
  - For `loadPlanDoc()`'s `planId: row.plan ?? row.id` → `plan: row.plan ?? row.id`.

  **Patterns to follow:**
  - The same shape is used in `indexAll()` (line ~213) and `loadPlanDoc()` (line ~330). Both should be updated identically.

  **Test scenarios:**
  - Happy path: `indexAll` writes a doc with `parent` and `plan` keys (camelCase). The indexer e2e spec verifies the doc shape after a round-trip through Meilisearch.
  - Edge case: a root plan (`axe.parent IS NULL`, `axe.plan IS NULL`) gets indexed with `parent: null` and `plan: <axe.id>` (synthesized self-reference).
  - Edge case: a sub-axe (`axe.parent` and `axe.plan` both set) gets indexed with `parent: <parent.id>` and `plan: <root.id>`.

  **Execution note:** Must ship in the same release as U4 and U5 — partial rollout breaks search at the read or render stage.

  **Verification:**
  - `grep -n "parentId\|planId" apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts apps/backend/src/plans/plans/plan-indexer/plan-index.constants.ts` returns no matches (excluding the `loadPlanDoc` method name itself, which describes "load the doc" not the field name).
  - The plan-indexer e2e spec passes against a live Meilisearch instance with the renamed shape.

---

- U4. **Update the read-side proxy for the Axe rename (filters, contextFields, e2e specs)**

  **Goal:** Update `buildTenantFilter` and `shapeHit` for the `'plans'` case so they emit `parent`/`plan` instead of `parentId`/`planId`. Update the router e2e specs that assert filter literals or seed plan docs.

  **Requirements:** R5

  **Dependencies:** U3.

  **Files:**
  - Modify: `apps/backend/src/search/search.service.ts`:
    - `buildTenantFilter` `case 'plans':` — `AND parentId IS NULL` / `AND parentId IS NOT NULL` → `AND parent IS NULL` / `AND parent IS NOT NULL`.
    - `shapeHit` `case 'plans':` — `contextFields.parentId` → `contextFields.parent`, `contextFields.planId` → `contextFields.plan`. The raw-hit accessors (`rawHit.parentId`, `rawHit.planId`) become `rawHit.parent`, `rawHit.plan`.
    - JSDoc on `buildTenantFilter` that names the plan branch's parent-clause in prose.
  - Test: `apps/backend/src/search/search.router.e2e-spec.ts`:
    - `seedPlanDoc` helper signature: rename `parentId: number | null` → `parent: number | null`, rename `planId?: number` → `plan?: number`. The default `args.planId ?? args.id` → `args.plan ?? args.id`.
    - Every `seedPlanDoc({...})` call: `parentId: ...` → `parent: ...`, `planId: rootId` → `plan: rootId`.
    - The 3 `planParentFilter` tests (`'root'`, `'axe'`, `'all'`) — verify their expectations still hold after the rename. The `planParentFilter` enum values themselves (`'root'` / `'axe'` / `'all'`) do NOT change; only the underlying filter literal does.
  - Test: `apps/backend/src/search/search-admin.router.e2e-spec.ts` (any seed call or filter literal asserting on `parentId`/`planId` for plans).

  **Approach:**
  - The `planParentFilter` request input keeps its enum values (`'root'`, `'axe'`, `'all'`); only the filter literal changes inside `buildTenantFilter`.
  - The `contextFields` keys change in concert with the doc field names — frontend must change in lockstep (U5).

  **Patterns to follow:**
  - Same rename mechanics as the U3 plan from `2026-05-04-001` (which renamed snake_case → camelCase across this same file).

  **Test scenarios:**
  - Happy path (existing): `planParentFilter: 'root'` returns only top-level plans, `'axe'` returns only sub-axes, `'all'` returns both. All 3 must pass against the new filter literal.
  - Edge case: A `seedPlanDoc({ parent: null, ... })` produces a doc that matches `parent IS NULL` but not `parent IS NOT NULL`. Same for non-null `parent`.
  - Edge case: A sub-axe seed with `plan: rootId` is hit-shaped with `contextFields.plan === rootId` (used by frontend nav).

  **Execution note:** Must ship with U3 and U5.

  **Verification:**
  - `grep -n "parentId\|planId" apps/backend/src/search/search.service.ts` returns no matches.
  - `grep -n "parentId\|planId" apps/backend/src/search/search.router.e2e-spec.ts apps/backend/src/search/search-admin.router.e2e-spec.ts` returns no matches.
  - Both router e2e specs pass.

---

- U5. **Update frontend accessors, navigation, and tests for the Axe rename**

  **Goal:** Match the renamed `contextFields` keys (`parent`, `plan`) on the read side in every frontend component and test fixture that touches plan hits.

  **Requirements:** R5

  **Dependencies:** U4.

  **Files:**
  - Modify: `apps/app/src/search/search-result-list.tsx` — the `plans:root` / `plans:axe` partition reads `h.contextFields?.['parentId']`. Rename to `['parent']`.
  - Modify: `apps/app/src/search/search-result-row-plan.tsx` — the badge swap reads `ctx['parentId']`. Rename to `ctx['parent']`.
  - Modify: `apps/app/src/search/use-search-hit-navigation.ts` — the `'plan'` case reads `ctx['planId']`. Rename to `ctx['plan']`. Both the access path and the `planIdRaw` local variable rename.
  - Test: `apps/app/src/search/__tests__/search-result-rows.test.tsx` — every `contextFields: { parentId: ... }` for plan rows becomes `{ parent: ... }`. The `flattenSearchResponse` partition test fixtures that build `contextFields: { parentId: ... }` for the plan bucket get the same rename.

  **Approach:**
  - Mechanical key rename. No structural change to row components, navigation, or partition logic.
  - Watch for any test fixture or component file that builds plan hits with `parentId`/`planId` keys — these must all flip to `parent`/`plan`. Other entities' fixtures are untouched.

  **Patterns to follow:**
  - The same rename mechanics as the prior U4 plan (`2026-05-04-001`) which migrated frontend accessors from snake_case to camelCase.

  **Test scenarios:**
  - Happy path: `SearchResultRowPlan` with `ctx: { parent: null }` shows the `"Plan"` badge; with `ctx: { parent: 1 }` shows `"Axe"`.
  - Happy path: `flattenSearchResponse` partitions a plans bucket into `Plans` / `Axes` sections based on `ctx.parent` (not `ctx.parentId`).
  - Edge case: navigation routes a sub-axe hit to the URL built with `ctx.plan` as the `planActionUid`. Falls back to `hit.id` when `ctx.plan` is absent (defensive).

  **Execution note:** Must ship with U3 and U4.

  **Verification:**
  - `grep -rn "parentId\|planId" apps/app/src/search/` returns no matches in the search/ directory (other modules in the app may legitimately keep `parentId` as a frontend field name — out of scope).
  - The plan-row and partition tests pass with the renamed fixtures.

---

- U6. **Update ADR 0017 to reflect the schema-derivation pattern and the rename**

  **Goal:** Sync the architecture record so future readers see the derivation as canonical.

  **Requirements:** R7

  **Dependencies:** U2, U5.

  **Files:**
  - Modify: `doc/adr/0017-meilisearch-global-search-architecture.md`.

  **Approach:**
  - In the existing "Schémas de documents Meilisearch" section: note that schemas are now `z.pick(...)` / `z.extend(...)` projections of canonical domain schemas (with one-line examples per entity is fine).
  - In the existing multi-tenant filter table: rename the plan-row filter literal from `parentId IS NULL` → `parent IS NULL` and `parentId IS NOT NULL` → `parent IS NOT NULL`.
  - Append to the "Notes de migration" section: a new `2026-05-04 (#2)` entry covering the Axe rename and the rebuild step (one entity: `reindexPlans` only).
  - Reference this plan from the existing references list.

  **Patterns to follow:**
  - The existing migration-notes block appended in U6 of plan `2026-05-04-001`. Same shape.

  **Test scenarios:**
  - Test expectation: none — documentation-only change.

  **Verification:**
  - `grep -n "parentId\|planId" doc/adr/0017-meilisearch-global-search-architecture.md` returns no matches.
  - The reference to `doc/plans/2026-05-04-002-refactor-search-docs-from-domain-plan.md` is present in the references list.

---

## System-Wide Impact

- **Interaction graph:** The 5 schema files are pure type definitions with no runtime side effects. The `axeTableSchema` export change has no runtime impact. The Axe rename ripples through the plan-indexer service, the read-side proxy, and the frontend — but only on the `'plans'` index branch. No cross-service callbacks are touched.
- **Error propagation:** No change. Zod parse failures continue to surface as today; the indexer's existing error-classification stack handles Meilisearch errors unchanged.
- **State lifecycle risks:** Same as prior plan (`2026-05-04-001`): if the post-deploy `reindexPlans` rebuild is skipped, the plans index will silently return zero hits (filters reference `parent`/`plan` but stored docs still have `parentId`/`planId`). Mitigation: the runbook specifies this single rebuild call. Other 4 indexes are wire-shape-stable, so no rebuild needed for them.
- **API surface parity:** No tRPC contract change. `SearchRequestSchema.planParentFilter` keeps the same enum values (`'all' | 'root' | 'axe'`). Only the underlying filter literal that the proxy emits to Meilisearch changes. Frontend `contextFields` is `Record<string, unknown>` — the rename is at the string-key level, no TypeScript surface breaks.
- **Integration coverage:** Same two-layer coverage (domain schema specs + backend e2e specs against a live Meilisearch). Frontend tests cover the partition + badge swap.
- **Unchanged invariants:**
  - The 5 Meilisearch index names (`plans`, `fiches`, `indicateurs`, `actions`, `documents`).
  - The composite Action primary key format (`'${actionId}:${collectiviteId}'`).
  - The synthesized fields (`AxeSearchDoc.plan`, `FicheSearchDoc.visibleCollectiviteIds`, `ActionSearchDoc.id`, `ActionSearchDoc.type`) all keep their semantics — only the schema-layer derivation pattern changes for them.
  - Tenant-isolation guarantees (the filter literals are mechanical renames; no semantic change).
  - The `'upsert'` admin mode continues to be insufficient for this migration; only `'rebuild'` cleanly drops the old `parentId`/`planId` keys from the plans index.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Search returns 0 hits on the `plans` index post-deploy if the operator skips `reindexPlans { mode: 'rebuild' }` | Documented runbook (one entity, ~minutes). Same shape as the prior plan's runbook, scoped narrower. The other 4 indexes are unaffected, so this rebuild is the only operator step |
| Partial rollout (U3 ships without U4 or U5) leaves the plans index in a half-converted state | Plan units explicitly state the deploy coupling. `ce-work` should bundle U3 + U4 + U5 into one PR even if commits are split |
| `axeTableSchema` export change has unforeseen consumers that rely on it being private (very unlikely — file-private exports have no consumers by definition, but a barrel re-export pattern could already include it) | The barrel `packages/domain/src/plans/index.ts` already re-exports from `axe.schema.ts` via `export * from`. Adding `export` to `axeTableSchema` is purely additive — nothing currently breaks. Verified by grep at planning time |
| `.pick()` on `ficheSchema` carries `.max()` and `.describe()` chains into `FicheSearchDocSchema`, leading to test fixture rejections that worked before | `.max()` is a non-destructive validator; the chain runs only at `parse` time and the indexer never feeds 301-character titres in practice. The `.describe()` is ignored at runtime. No actual regressions expected; verify by running the existing schema spec at implementation time |
| Mixing `zod/mini` and full Zod composition operators in one search-doc file produces type-inference quirks | Use the namespace form (`z.pick(...)`, `z.extend(...)`) consistently across all 5 files. Already the established pattern in the repo (see `score-snapshot-action-scores-payload.schema.ts`) |
| The deferred question on `bibliothequeFichierSchema.collectiviteId` nullability remains unresolved | This refactor preserves the search-doc's nullable claim; the underlying truth gets clarified separately. No regression introduced |

---

## Documentation / Operational Notes

### Rollout sequence (mandatory)

After deploy of U3 + U4 + U5:

1. Verify the backend booted cleanly (logs show `[PlanIndexerService] Index settings applied` with the new `parent` filterable attribute).
2. Run `search.admin.reindexPlans { mode: 'rebuild' }`. The other 4 entities do **not** need a rebuild (their wire shape is unchanged).
3. Verify the call returned `{ indexedCount > 0, mode: 'rebuild' }` and the swap completed.
4. Smoke-test the modal: ⌘K, query a known plan name, expand the `Axes` section, click an axe → confirm the URL is the parent plan's URL. Toggle the `Axes` chip → confirm only sub-axes show. Toggle `Plans` chip alone → confirm only root plans show.

If step 4 fails, the rebuild was not run or did not complete. Re-run the admin call.

### Solutions doc to capture after this lands

- **`doc/solutions/architecture-patterns/derive-search-docs-from-domain-schemas.md`** — pattern for deriving Meilisearch-doc Zod schemas from domain table schemas: `z.pick(...) + z.extend(...)`, namespace-form for zod/mini interop, when to override (synthesis, type narrowing, nullability), how to scope rebuilds.
- **`doc/solutions/architecture-patterns/meilisearch-index-rename-runbook.md`** — note from the prior plan that wasn't captured. This refactor is the second plans-index rename in two weeks; documenting the rebuild sequence prevents re-discovery cost on the next one.

---

## Sources & References

- **Prior plan (just shipped):** [doc/plans/2026-05-04-001-refactor-search-doc-shape-and-plan-axe-plan.md](2026-05-04-001-refactor-search-doc-shape-and-plan-axe-plan.md) — the camelCase + plan/axe UI refactor that established the current search-doc layout this plan now refactors further.
- **Original feature plan:** [doc/plans/2026-04-27-002-feat-meilisearch-global-search-plan.md](2026-04-27-002-feat-meilisearch-global-search-plan.md) — context for the original hand-written search-doc decision.
- **ADR being updated:** [doc/adr/0017-meilisearch-global-search-architecture.md](../adr/0017-meilisearch-global-search-architecture.md).
- **Conventions ADR:** [doc/adr/0003-conventions-de-code.md](../adr/0003-conventions-de-code.md) — file/symbol naming.
- **Saved learning (forward-guard, not currently active):** [doc/solutions/logic-errors/zod-default-leaks-into-partial-update-schema.md](../solutions/logic-errors/zod-default-leaks-into-partial-update-schema.md) — `.default()` survives `.pick()` / `.partial()`. Confirmed not present on any of this refactor's source schemas.
- **Related code:**
  - `packages/domain/src/plans/fiches/axe.schema.ts` (export change target)
  - `packages/domain/src/referentiels/scores/score-snapshot-action-scores-payload.schema.ts` (mini-source pick precedent)
  - `packages/domain/src/collectivites/documents/preuve-audit-with-fichier.schema.ts` (extend-of-pick precedent)
