---
title: "feat: Global ⌘K search across plans, fiches, indicateurs, and mesures (Meilisearch)"
type: feat
status: active
date: 2026-04-27
origin: doc/plans/2026-04-27-001-meilisearch-global-search-requirements.md
---

# feat: Global ⌘K search across plans, fiches, indicateurs, and mesures (Meilisearch)

## Overview

Implement the Notion-style global ⌘K search defined in the [requirements doc](2026-04-27-001-meilisearch-global-search-requirements.md). The work introduces a new `SearchIndexerService` (thin Meilisearch SDK wrapper) under `apps/backend/src/utils/search-indexer/` — alongside the other cross-cutting utilities like `webhooks/`, `bullmq/`, and `database/` — four per-domain indexer services co-located with their entity modules, four BullMQ queues + `@Processor` workers, a read-side tRPC proxy in `apps/backend/src/search/` that fans out to Meilisearch via `multiSearch`, an admin backfill router with `upsert` / `rebuild` modes, and a global ⌘K modal in the Next.js app.

The plan is structured as six phases delivered in order: foundation (SDK wrapper + schemas), four per-domain indexers, read-side proxy, admin backfill, frontend modal + result rows, and an ADR documenting the architecture.

---

## Problem Frame

Today every entity list (`list-fiches`, `list-indicateurs`, `list-personnalisation-questions`, `get-referentiel`) implements its own page-scoped substring search using Postgres `ilike`. Users have to know *where* to look before they can search; results have no relevance ranking, no typo tolerance, no field weighting, and no snippets. The product opportunity is a single search surface available everywhere via ⌘K, with results from across plans, fiches actions, indicateurs, and referentiel mesures, ranked and snippet-highlighted, keyboard-first.

The requirements doc resolved the architectural question (Meilisearch over Postgres FTS for instant-search UX/DX), the topology (NestJS proxy, never browser → Meilisearch), the sync mechanism (per-entity-type BullMQ queues into per-domain indexer services that share a thin SDK wrapper), and the scope (per-collectivité for plans/fiches/custom indicateurs, global for referentiel mesures and predefined indicateurs).

This plan turns those decisions into concrete implementation units. (see origin: [doc/plans/2026-04-27-001-meilisearch-global-search-requirements.md](2026-04-27-001-meilisearch-global-search-requirements.md))

---

## Requirements Trace

- R1. Global ⌘K modal triggered from any authed page returns ranked search results within ~200 ms server-side.
- R2. Six UI chips (`Plans` / `Actions` / `Sous-actions` / `Indicateurs` / `Mesures` / `Documents`) filter the result set; a "Mode exclusif" toggle disables non-selected chips on click. (Documents was added to the chip set during planning to match the `bibliotheque_fichier` index — confirm with stakeholders if a different UI surface is preferred.)
- R3. Result rows display matched terms highlighted in title and snippet, with a clear type badge.
- R4. Cross-collectivité isolation: a user of collectivité A never sees collectivité B's fiches, plans, or custom indicateurs unless explicitly shared via `fiche_action_sharing`.
- R5. Predefined indicateurs (where `collectivite_id IS NULL`) are searchable across collectivités; custom indicateurs are filtered to the active collectivité.
- R6. Referentiel mesures are searchable per-collectivité, *not* globally as the brainstorm originally specified. Each indexed mesure document is a (`action_definition` × collectivité) tuple, denormalizing the collectivité's `action_commentaire.commentaire` text so the user's annotations are also searchable. A document exists for every (action × collectivité) pair where the collectivité has activated the referentiel (any row in `client_scores` for that referentiel, or any related interaction). This supersedes the brainstorm's "global mesures" decision after a planning-time scope refinement; the trade-off is that discovery of mesures from a *non-activated* referentiel is no longer possible — flagged in Open Questions.
- R7. Write-to-search lag is consistently under ~5 s for entities created or edited via NestJS write paths.
- R8. Soft-deleted entities are removed from the index (not filtered at query time).
- R9. An admin can re-run a full re-index of any entity type, choosing `upsert` (fast, idempotent) or `rebuild` (atomic swap-indexes, orphan-clearing) mode.
- R10. Internal indexing pipeline is independent of the existing external `WebhookService` so partner contracts and search-side schema changes evolve separately.
- R11. Meilisearch is never reachable from the browser; all search calls go through a NestJS tRPC endpoint.

---

## Scope Boundaries

- Search history, "recents", suggested queries — out of scope.
- Saved searches, advanced query syntax (`field:value`, AND/OR/NOT operators) — out of scope.
- Cross-collectivité search for users with access to multiple collectivités — search the *active* collectivité only.
- Search inside attached files / preuves / PDFs (no OCR, no body indexing).
- Faceted filtering beyond entity type (no pilote / statut / axe / thématique facets in v1).
- Search analytics / telemetry dashboards.
- Replacing the existing per-page `ilike` filters — global search is additive.

### Deferred to Follow-Up Work

- ADR 0017 (search architecture) is in this plan as U11 but the doc itself can be merged separately if needed.
- Meilisearch operational runbook (start/stop, backup/restore on Koyeb) — separate operational PR; this plan documents the runbook *requirements* but does not produce the runbook file.
- Persisted outbox table for full transactional integrity between DB write and queue enqueue (per ADR 0006 spirit) — see Risks; v1 accepts the small gap and relies on admin backfill as the correctness backstop.

---

## Context & Research

### Relevant Code and Patterns

**NestJS module + tRPC convention:**
- Top-level merge: [apps/backend/src/utils/trpc/trpc.router.ts](../../apps/backend/src/utils/trpc/trpc.router.ts) — add `search:` here.
- Domain aggregator pattern: [apps/backend/src/plans/plans/plans.router.ts](../../apps/backend/src/plans/plans/plans.router.ts).
- Per-feature router template: [apps/backend/src/plans/plans/list-plans/list-plans.router.ts](../../apps/backend/src/plans/plans/list-plans/list-plans.router.ts).
- Admin / platform-scoped permission gating: [apps/backend/src/collectivites/collectivite-crud/collectivite-crud.router.ts](../../apps/backend/src/collectivites/collectivite-crud/collectivite-crud.router.ts) (uses `permissionService.isAllowed(user, op, ResourceType.PLATEFORME, null)` — no separate `adminProcedure`).
- Result/error pattern: services return `Result<Data, ErrorEnum>` from [apps/backend/src/utils/result.type.ts](../../apps/backend/src/utils/result.type.ts); routers unwrap via `createTrpcErrorHandler` ([apps/backend/src/utils/trpc/trpc-error-handler.ts](../../apps/backend/src/utils/trpc/trpc-error-handler.ts)).

**BullMQ:**
- Root config (already wired): [apps/backend/src/app.module.ts](../../apps/backend/src/app.module.ts) `BullModule.forRootAsync(...)`. Per-process Vitest prefix `bull:test:${process.pid}` is already applied.
- Co-located in-backend processor template: [apps/backend/src/plans/reports/generate-plan-report-pptx/generate-reports.worker.ts](../../apps/backend/src/plans/reports/generate-plan-report-pptx/generate-reports.worker.ts) — `@Processor(NAME) extends WorkerHost`, `async process(job)`, providers listed in module.
- Default job options precedent: [apps/backend/src/utils/webhooks/webhook.service.ts](../../apps/backend/src/utils/webhooks/webhook.service.ts) lines 18–27 (`removeOnComplete: 1000`, `attempts: 10`, `backoff: { type: 'exponential', delay: 1000 }`).
- Queue constants location: [apps/backend/src/utils/bullmq/queue-names.constants.ts](../../apps/backend/src/utils/bullmq/queue-names.constants.ts).

**Drizzle / DB query patterns:**
- CTE + dynamic-filter pattern: [apps/backend/src/referentiels/list-actions/list-actions.service.ts](../../apps/backend/src/referentiels/list-actions/list-actions.service.ts) lines 58–62.
- Heavy joins + aliasedTable: [apps/backend/src/plans/fiches/list-fiches/list-fiches.service.ts](../../apps/backend/src/plans/fiches/list-fiches/list-fiches.service.ts).
- Cross-tenant `OR (collectivite_id IS NULL OR = X)` pattern: [apps/backend/src/indicateurs/indicateurs/list-indicateurs/list-indicateurs.service.ts](../../apps/backend/src/indicateurs/indicateurs/list-indicateurs/list-indicateurs.service.ts).

**Service-level write paths to instrument:**
- Plans: [apps/backend/src/plans/plans/upsert-plan/upsert-plan.service.ts](../../apps/backend/src/plans/plans/upsert-plan/upsert-plan.service.ts), [apps/backend/src/plans/plans/delete-plan/delete-plan.service.ts](../../apps/backend/src/plans/plans/delete-plan/delete-plan.service.ts), [apps/backend/src/plans/plans/create-plan-aggregate/create-plan-aggregate.service.ts](../../apps/backend/src/plans/plans/create-plan-aggregate/create-plan-aggregate.service.ts), [apps/backend/src/plans/plans/import-plan-aggregate/import-plan.application-service.ts](../../apps/backend/src/plans/plans/import-plan-aggregate/import-plan.application-service.ts).
- Fiches: [apps/backend/src/plans/fiches/create-fiche/create-fiche.service.ts](../../apps/backend/src/plans/fiches/create-fiche/create-fiche.service.ts), [apps/backend/src/plans/fiches/update-fiche/update-fiche.service.ts](../../apps/backend/src/plans/fiches/update-fiche/update-fiche.service.ts) (already calls `webhookService.sendWebhookNotification` — model the indexing enqueue right next to it), [apps/backend/src/plans/fiches/delete-fiche/delete-fiche.service.ts](../../apps/backend/src/plans/fiches/delete-fiche/delete-fiche.service.ts) (cascades to sub-fiches), [apps/backend/src/plans/fiches/bulk-edit/bulk-edit.service.ts](../../apps/backend/src/plans/fiches/bulk-edit/bulk-edit.service.ts), [apps/backend/src/plans/fiches/share-fiches/share-fiche.service.ts](../../apps/backend/src/plans/fiches/share-fiches/share-fiche.service.ts) (changes cross-collectivité visibility — must enqueue).
- Indicateurs: [apps/backend/src/indicateurs/definitions/mutate-definition/](../../apps/backend/src/indicateurs/definitions/mutate-definition/) (create/update/delete-definition.service.ts), [apps/backend/src/indicateurs/import-indicateurs/import-indicateur-definition.service.ts](../../apps/backend/src/indicateurs/import-indicateurs/import-indicateur-definition.service.ts).
- Referentiel actions: [apps/backend/src/referentiels/import-referentiel/import-referentiel.service.ts](../../apps/backend/src/referentiels/import-referentiel/import-referentiel.service.ts) (only changes via re-import — single hook point).

**Test patterns:**
- Multi-collectivité fixture: [apps/backend/src/plans/fiches/list-fiches/list-fiches.router.e2e-spec.ts](../../apps/backend/src/plans/fiches/list-fiches/list-fiches.router.e2e-spec.ts) lines 64–91 — `addTestCollectivite()`, `addTestUser()`, `setUserCollectiviteRole(...)`.
- Test app helpers: [apps/backend/test/app-utils.ts](../../apps/backend/test/app-utils.ts), [apps/backend/test/auth-utils.ts](../../apps/backend/test/auth-utils.ts).
- Fixture cleanup: `withOnTestFinished` (see [apps/backend/src/plans/fiches/fiches.test-fixture.ts](../../apps/backend/src/plans/fiches/fiches.test-fixture.ts)).
- BullMQ test isolation: per-process prefix already applied (no extra setup required).

**Frontend:**
- Authed providers shell where ⌘K modal will mount: [apps/app/app/(authed)/authed-providers.tsx](../../apps/app/app/(authed)/authed-providers.tsx).
- Active collectivité hook: `useCollectiviteId()` / `useCollectiviteContext()` from `@tet/api/collectivites`.
- tRPC hook convention: `const trpc = useTRPC(); useQuery(trpc.X.Y.queryOptions(...))` — reference: [apps/app/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/plans/tableau-de-bord/_hooks/use-fetch-modules.ts](../../apps/app/app/%28authed%29/collectivite/%5BcollectiviteId%5D/%28acces-restreint%29/plans/tableau-de-bord/_hooks/use-fetch-modules.ts).
- Modal primitive: [packages/ui/src/design-system/Modal/Modal.tsx](../../packages/ui/src/design-system/Modal/Modal.tsx) (uses `@floating-ui/react`).
- No global keyboard shortcut precedent — net-new hook to add under `apps/app/src/ui/`.
- Highlight rendering reference (not for ⌘K but useful styling): [apps/app/src/ui/dropdownLists/MesuresReferentielsDropdown/MesuresReferentielsDropdown.tsx](../../apps/app/src/ui/dropdownLists/MesuresReferentielsDropdown/MesuresReferentielsDropdown.tsx).

### Institutional Learnings

- **[doc/adr/0006-plateforme-background-jobs.md](../adr/0006-plateforme-background-jobs.md)** — Treat Redis as non-persistent on Koyeb. The strict reading is "DB outbox is non-optional"; this plan accepts the brainstorm's explicit choice to defer the outbox to a follow-up and rely on admin backfill as the correctness backstop. Documented as a Risk.
- **[doc/solutions/architecture-patterns/supabase-to-trpc-with-computed-enrichment-2026-04-27.md](../solutions/architecture-patterns/supabase-to-trpc-with-computed-enrichment-2026-04-27.md)** — Always set `.output(zodSchema)` on procedures. Multi-tenant gating is explicit (no RLS on the backend). For autocomplete-style sibling endpoints, leak surfaces are silent — mirror permission checks.
- **[doc/solutions/architecture-patterns/extract-history-repository-from-service.md](../solutions/architecture-patterns/extract-history-repository-from-service.md)** — Repository pattern + DDD; if a search-related repository is introduced, follow this shape.
- **[doc/solutions/database-issues/select-for-update-race-condition-drizzle-orm.md](../solutions/database-issues/select-for-update-race-condition-drizzle-orm.md)** — Don't put external HTTP calls inside DB transactions. Pattern: commit DB → enqueue → external write. The indexer follows this strictly.
- **[doc/solutions/test-failures/parallel-e2e-test-isolation.md](../solutions/test-failures/parallel-e2e-test-isolation.md)** — Never use `getAuthUser(YOLO_DODO)` or hardcoded `collectiviteId 1/2/3`. Use `addTestCollectiviteAndUser`. Tests that mutate global tables (referentiel definitions) must be excluded from parallel runs in `vitest.config.mts`.

### External References

- Meilisearch JS SDK 0.57.0 (April 2026) — [meilisearch-js GitHub](https://github.com/meilisearch/meilisearch-js).
- Filter expression reference (incl. `IS NULL`): [Meilisearch docs](https://www.meilisearch.com/docs/capabilities/filtering_sorting_faceting/advanced/filter_expression_syntax). `IS NULL` / `IS EMPTY` introduced in v1.2.
- Multi-search vs federated search: [Meilisearch docs](https://www.meilisearch.com/docs/learn/multi_search/multi_search_vs_federated_search). We use multi-search (per-bucket results, caller merges) — not federated — because each entity type has different ranking weights and the UI groups results by chip.
- Multilingual / `localizedAttributes`: [Meilisearch docs](https://www.meilisearch.com/docs/learn/indexing/multilingual-datasets). Mandatory for French content quality.
- Highlighting params (`attributesToHighlight`, `attributesToCrop`, `cropLength`): [search params](https://www.meilisearch.com/docs/reference/api/search).
- Async tasks (FIFO per index): [Meilisearch docs](https://www.meilisearch.com/docs/learn/async/asynchronous_operations).
- Error codes: [overview](https://www.meilisearch.com/docs/reference/errors/overview).

---

## Key Technical Decisions

- **Meilisearch JS SDK pinned to `0.57.0`+ in `apps/backend/package.json`.** Compatible with all v1.x server versions; we'll target a Meilisearch server >= 1.10 on Koyeb.
- **Minimum Meilisearch server version: v1.10.** `IS NULL` / `IS NOT NULL` (used for the `parent_fiche_id` and `collectivite_id IS NULL` filters) is supported from v1.2; v1.10 is the version we pin for the modern `localizedAttributes` API and the recent federated-search and indexing performance improvements. Operational PR pinning Koyeb to v1.10+ is a prerequisite of this plan.
- **Multi-tenant filter pattern: per-query `filter` from a trusted backend.** No tenant tokens (we proxy through NestJS, browser never sees Meilisearch). The filter is constructed by a single domain-aware helper (`buildTenantFilter(collectiviteId, indexName, ficheParentFilter)`) inside `SearchService` (in `apps/backend/src/search/`). This is the only call site that builds filters — the SDK wrapper `SearchIndexerService` (in `apps/backend/src/utils/search-indexer/`) is a generic passthrough with no domain knowledge.
- **Index design: 5 indexes (`plans`, `fiches`, `indicateurs`, `actions`, `documents`).** The `fiches` index uses a multi-valued `visible_collectivite_ids: number[]` field (owner + every `fiche_action_sharing` target) instead of a scalar `collectivite_id`, so shared fiches naturally surface for the recipient collectivité. The `indicateurs` and `documents` indexes use a nullable `collectivite_id` (null = predefined / global, populated = collectivité-owned) and the proxy filters with `collectivite_id IS NULL OR collectivite_id = X`. The `actions` index documents are per-(action × collectivité): each document carries the action content (denormalized from `action_definition`) plus the collectivité's `action_commentaire.commentaire` text (nullable when the collectivité has activated the referentiel but not yet annotated the action). The proxy filters with `collectivite_id = ${activeId}`. Document count for `actions` ≈ (referentiel actions) × (collectivités that have activated each referentiel).
- **Document message shape: `{ op: 'upsert' | 'delete', entityId }`.** Messages do not carry payloads; the processor re-loads the canonical document from Postgres at job time. This makes job ordering self-healing (a stale upsert never overwrites a fresh one because there is no payload to be stale) and means the indexer is always consistent with the DB at the moment the job runs.
- **Soft-delete enqueues a `delete` op, not an upsert with `deleted=true`.** Removes the need for a query-time `deleted=false` filter and the associated risk of forgetting it on a new query path.
- **Parent-fiche delete cascade.** [delete-fiche.service.ts](../../apps/backend/src/plans/fiches/delete-fiche/delete-fiche.service.ts) deletes the parent and every child via `or(eq(id), eq(parentId))`. The indexer enqueue must collect the affected ids *before* the DB delete, then enqueue one delete per id after commit.
- **Sharing changes enqueue per-fiche re-indexing.** [share-fiche.service.ts](../../apps/backend/src/plans/fiches/share-fiches/share-fiche.service.ts) and `bulkShareFiches` enqueue an upsert for every affected fiche id so `visible_collectivite_ids` stays accurate.
- **BullMQ default job options for indexing queues:** `removeOnComplete: 1000, attempts: 10, backoff: { type: 'exponential', delay: 1000 }` — mirrors the webhook pipeline.
- **`jobId` for dedupe.** Upserts use `jobId: '${index}:upsert:${entityId}'` so a fresh upsert collapses any pending earlier upsert for the same entity. Deletes use `jobId: '${index}:delete:${entityId}'` (different namespace so a pending upsert and a pending delete don't shadow each other).
- **Worker concurrency.** Per-queue `@Processor` runs with default concurrency (typically 1 per worker host). The "always re-load from DB" rule makes higher concurrency safe later if needed; v1 doesn't tune this.
- **Retry classification.** SDK errors are classified into permanent vs retryable in a `classifyMeilisearchError(err)` helper inside `SearchIndexerService`. Permanent errors (`invalid_api_key`, `index_not_found`, `invalid_filter`, `invalid_settings_*`, `payload_too_large`, etc.) wrap with `UnrecoverableError` from `bullmq` so BullMQ does not retry. Retryable errors (5xx, `MeiliSearchCommunicationError`, `too_many_search_requests`) re-throw normally.
- **Read-side fan-out: Meilisearch `multiSearch` (not federated).** Per-index buckets give us per-entity-type result lists with their own ranking, which the merger composes for the chip-grouped UI. Federated mode would re-rank across indexes which doesn't fit the chip taxonomy.
- **Snippet/highlighting:** `attributesToHighlight: ['titre', 'description']`, `attributesToCrop: ['description:30']`, `highlightPreTag: '<mark>'`, `highlightPostTag: '</mark>'`. Frontend reads `_formatted` from each hit.
- **Backfill modes:** admin endpoint exposes both `mode: 'upsert'` (idempotent batched re-index, default) and `mode: 'rebuild'` (write to a temporary index, swap atomically via `client.swapIndexes`, drop the old). Rebuild takes a Redis lock keyed per index name to prevent concurrent rebuilds; second concurrent caller gets a 409.
- **French content settings:** `localizedAttributes: [{ attributePatterns: ['titre', 'description', 'contenu_*'], locales: ['fra'] }]`. No custom stop-word list (defaults are fine; French stop-word lists historically over-filter). No initial synonyms list.
- **Mode exclusif semantics (Model A — radio).** Toggling exclusif on then clicking a chip auto-disables others and re-runs the query with only that chip's index. Toggling exclusif off restores the previous chip set. The backend receives the explicit `enabledIndexes: string[]` array and only runs `multiSearch` against those indexes.
- **Search request input is bounded:** `query: z.string().min(1).max(200)`, `enabledIndexes: z.array(z.enum([...])).min(1)`, `collectiviteId: z.number().int().positive()`. Strip control chars before passing to Meilisearch.
- **Search response uses `.output(searchResponseSchema)`** to catch schema drift at the boundary, per the project pattern.
- **`collectiviteId` is read from the request input, not from session context.** This matches every other domain router in the repo (e.g. `list-fiches`, `list-plans`, `list-actions`) where the active collectivité is a payload field validated by `permissionService.isAllowed(...)`. The constraint that v1 only searches the *active* collectivité is enforced by the frontend (the modal reads `useCollectiviteId()` and passes it through). A user with access to multiple collectivités can technically issue a raw API call against any of their accessible collectivités — this is the same surface as the existing list endpoints and is intentionally consistent with them.
- **`accesRestreint` collectivités are gated at the request level, not via per-document fields.** The proxy resolves `collectivites.isPrivate(collectiviteId)` and branches the permission check to `COLLECTIVITES.READ_CONFIDENTIEL`. If the user lacks that permission for a confidential collectivité, the entire search request is rejected (FORBIDDEN). The indexer does not denormalize an `acces_restreint` field onto documents because the proxy gate is sufficient: search is always scoped to one collectivité per request, so a user blocked at the gate sees no documents from that collectivité regardless of what's indexed.
- **Permission enum naming follows the existing dotted-key form** accessed via bracket notation: `PermissionOperationEnum['COLLECTIVITES.READ']`, `PermissionOperationEnum['COLLECTIVITES.READ_CONFIDENTIEL']`, `PermissionOperationEnum['COLLECTIVITES.MUTATE']`. The existing precedent for platform-admin gating ([apps/backend/src/collectivites/collectivite-crud/collectivite-crud.router.ts](../../apps/backend/src/collectivites/collectivite-crud/collectivite-crud.router.ts) lines 24–28) uses `COLLECTIVITES.MUTATE` + `ResourceType.PLATEFORME` — admin reindex endpoints follow the same pattern. **There is no `PLATEFORME_MUTATE` enum value; do not invent one.**
- **Rate limiting:** `search.query` is gated by `@nestjs/throttler` (already in deps) with a per-user limit of 60 requests / minute. Admin reindex endpoints use a stricter limit (5 / minute). This prevents both enumeration attempts and Meilisearch resource exhaustion (`too_many_search_requests` is already a retryable error code).
- **`_formatted` snippet rendering goes through DOMPurify (or equivalent sanitizer) — required, not optional.** Source data (fiche titles, descriptions) is user-controlled, so `_formatted` strings can contain arbitrary HTML. The result-row components use a single shared `<HighlightedText html={hit._formatted.titre} />` utility that runs DOMPurify before `dangerouslySetInnerHTML`. Tag allowlist: `mark` only.
- **Sentry breadcrumbs do not include the raw search query text.** Latency, result count, and a hashed query digest are sufficient for performance monitoring. RGPD considerations: French public sector users may search for personal names — those should not flow into Sentry payloads.

---

## Open Questions

### Resolved During Planning

- **Cross-collectivité semantics for shared fiches** — resolved as: shared fiches are searchable by recipient collectivités via `visible_collectivite_ids`. Sharing changes re-index. Consistent with the existing share feature's intent.
- **Ordering between concurrent BullMQ jobs for the same entity** — resolved as: messages contain only `{op, entityId}`; processor re-loads from DB. Eliminates ordering hazards.
- **Soft-delete handling** — resolved as: enqueues a `delete` op (not an upsert with `deleted=true`).
- **Backfill semantics** — resolved as: two modes (`upsert` for routine re-sync, `rebuild` with swap-indexes for orphan removal).
- **Mode exclusif behavior** — resolved as: Model A (clicking a chip in exclusif mode disables the others and re-runs the query against fewer indexes).
- **Federated vs multi-search** — resolved as: multi-search (per-bucket results merged client-side; matches the chip taxonomy).
- **Meilisearch server version pin** — resolved as: v1.10+ (operational prerequisite).

### Deferred to Implementation

- **Exact Meilisearch index settings tuning** (typo tolerance per-attribute, ranking-rule tweaks, exact `searchableAttributes` order) — needs to be tuned with real production data after initial roll-out. v1 ships with documented defaults.
- **Frontend behavior when active collectivité changes mid-modal-open** — recommended default: clear results and refetch. Implementer to confirm against the UX spec when wiring the collectivité-context hook.
- **Self-healing on 404 from a search-originated click** — if a result is clicked but the entity has been deleted (sync lag), the detail page already 404s. Whether to fire an opportunistic delete-by-id from the click handler to self-heal is deferred; v1 just relies on the eventual-consistency of the queue + admin backfill.
- **French synonyms list** — ship empty; add curated synonyms (e.g. `pcaet` → `plan climat`) iff usage analytics show misses.
- **Worker concurrency tuning** — start at default (1); revisit if write-to-search lag exceeds ~5 s under load.
- **Indicateur denormalized fields beyond definition mutations.** U5 instruments the `mutate-definition` services and the import path. If `thematiques` / `services` / `pilotes` change via paths outside those services (e.g. a tag-management route), the indexed `IndicateurDoc.thematiques` may drift. Implementer to enumerate any such paths during U5 and either add enqueue calls or document the drift as recoverable via the weekly admin upsert backfill.
- **Mesure discovery for non-activated referentiels.** With the new per-(action × collectivité) model, a collectivité that has not activated a referentiel cannot search its mesures — the documents do not exist for that pair. v1 accepts this trade-off. Future iteration: add a "discovery view" (e.g. an additional global mesures index, or a separate UI flow) that lets users browse referentiels they haven't started, with an explicit "activate to search" prompt. Defer to a follow-up brainstorm.
- **`indicateur_collectivite` overlay (commentaire / favoris / confidentiel).** The plan does not currently denormalize per-collectivité indicateur overlay data into the `indicateurs` index — only definition-level fields are indexed. If users expect to find their own indicateur annotations via search (parallel to the action_commentaire feature added for mesures), a similar per-(indicateur × collectivité) document model would need to be added. Defer until product feedback indicates the need.

---

## Output Structure

```text
apps/backend/src/utils/search-indexer/
├── search-indexer.module.ts                       # @Global() — exports SearchIndexerService for any domain to import
├── search-indexer.service.ts                      # Meilisearch SDK wrapper: upsert, delete, multiSearch, swap, settings
├── search-indexes.constants.ts                    # Index name constants (PLAN_INDEX, FICHE_INDEX, ...) + per-index settings declarations
├── search-error.util.ts                           # classifyMeilisearchError → UnrecoverableError or rethrow
└── search-indexer.service.e2e-spec.ts             # SDK wrapper round-trip tests against a live Meilisearch fixture

apps/backend/src/search/
├── search.module.ts                               # Imports SearchIndexerModule, exposes search.router + search-admin.router
├── search.router.ts                               # tRPC: search.query (read-side proxy)
├── search.service.ts                              # buildTenantFilter, query orchestration, _formatted shaping
├── search-admin.router.ts                         # tRPC: search.admin.reindex<Plans|Fiches|Indicateurs|Actions>
├── search-admin.service.ts                        # Backfill orchestration, rebuild-with-swap, Redis lock
├── search.router.e2e-spec.ts                      # Cross-collectivité isolation, shared-fiches visibility, mode exclusif
└── search-admin.router.e2e-spec.ts                # Admin gating, upsert vs rebuild modes, lock contention

apps/backend/src/plans/plans/
└── plan-indexer/
    ├── plan-indexer.service.ts                    # @Processor + transform + indexAll
    └── plan-indexer.service.e2e-spec.ts

apps/backend/src/plans/fiches/
└── fiche-indexer/
    ├── fiche-indexer.service.ts                   # @Processor + transform + indexAll + visible_collectivite_ids
    └── fiche-indexer.service.e2e-spec.ts

apps/backend/src/indicateurs/indicateurs/
└── indicateur-indexer/
    ├── indicateur-indexer.service.ts              # @Processor + transform + indexAll
    └── indicateur-indexer.service.e2e-spec.ts

apps/backend/src/referentiels/
└── action-indexer/
    ├── action-indexer.service.ts                  # @Processor + transform + indexAll + post-import fanout
    └── action-indexer.service.e2e-spec.ts

apps/backend/src/collectivites/documents/
└── document-indexer/
    ├── document-indexer.service.ts                # @Processor + transform + indexAll
    └── document-indexer.service.e2e-spec.ts

apps/backend/src/utils/bullmq/queue-names.constants.ts   # +4 new constants

packages/domain/src/search/
├── search-request.schema.ts                       # Zod input schema
├── search-response.schema.ts                      # Zod output schema (per-bucket hits)
└── search-document.schema.ts                      # Zod doc shapes per index (PlanDoc, FicheDoc, ...)

apps/app/src/search/
├── use-global-search-shortcut.ts                  # ⌘K listener hook
├── search-modal.tsx                               # Modal shell + input + chips + footer
├── search-result-list.tsx                         # Result list w/ keyboard nav
├── search-result-row-plan.tsx                     # Per-entity row components
├── search-result-row-fiche.tsx
├── search-result-row-indicateur.tsx
├── search-result-row-action.tsx
├── search-result-row-document.tsx
└── use-search-query.ts                            # Debounced tRPC query relying on react-query identity

doc/adr/0017-meilisearch-global-search-architecture.md
```

The implementer may adjust file names or sub-directory layout if implementation reveals a better shape — the per-unit `Files:` lists below remain authoritative for what each unit creates.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Sync flow (write path → index)

```mermaid
sequenceDiagram
    participant W as Write-path service (e.g. UpdateFicheService)
    participant DB as Postgres (Drizzle tx)
    participant Q as BullMQ queue
    participant P as @Processor (e.g. FicheIndexerService)
    participant T as Domain transform
    participant SI as SearchIndexerService
    participant MS as Meilisearch

    W->>DB: BEGIN; mutate fiche; COMMIT
    W->>Q: enqueue { op: 'upsert', entityId } (jobId: 'fiches:upsert:42')
    Q->>P: deliver job
    P->>DB: load canonical fiche + parent + plan + sharing list
    P->>T: transform → FicheDoc
    P->>SI: upsert(FICHE_INDEX, FicheDoc)
    SI->>MS: POST /indexes/fiches/documents
    MS-->>SI: { taskUid, status: 'enqueued' }
    SI-->>P: ok
    P-->>Q: success (job removed)
```

### Read flow (⌘K → ranked results)

```mermaid
sequenceDiagram
    participant U as User (browser)
    participant M as ⌘K modal
    participant API as tRPC search.query
    participant S as SearchService
    participant SI as SearchIndexerService
    participant MS as Meilisearch

    U->>M: ⌘K, types "carbone"
    M->>API: { query, enabledIndexes, collectiviteId } (debounced 150ms, sequence-id N)
    API->>S: search(...)
    S->>S: buildTenantFilter(ctx, perIndex)
    S->>SI: multiSearch([{indexUid, q, filter}, ...])
    SI->>MS: POST /multi-search
    MS-->>SI: { results: [{indexUid, hits, _formatted}, ...] }
    SI-->>S: typed bucket array
    S-->>API: SearchResponse (output schema)
    API-->>M: response (sequence-id N)
    M->>M: drop if older than latest sequence-id; render hits
```

### Filter shape per index

| Index         | Tenant filter expression                                                         |
| ------------- | ------------------------------------------------------------------------------- |
| `plans`       | `collectivite_id = ${activeId}`                                                  |
| `fiches`      | `visible_collectivite_ids = ${activeId}`                                          |
| `indicateurs` | `collectivite_id IS NULL OR collectivite_id = ${activeId}`                        |
| `actions`     | `collectivite_id = ${activeId}` *(per-collectivité, includes denormalized commentaire)* |

When the Sous-actions chip is exclusively selected, an additional `AND parent_fiche_id IS NOT NULL` (or `AND parent_fiche_id IS NULL` for Actions) is appended to the `fiches` filter.

---

## Implementation Units

- U1. **Meilisearch SDK wrapper module + queue constants**

**Goal:** Stand up `apps/backend/src/utils/search-indexer/` with the SDK wrapper, env config, index settings bootstrap, retry classification, and the four queue name constants. Place the wrapper alongside other cross-cutting utilities (`webhooks/`, `bullmq/`, `database/`) since it is a thin SDK layer with no domain knowledge — every per-domain indexer (U3–U6) and the read-side proxy (U7) imports from it.

**Requirements:** R1, R7, R10, R11.

**Dependencies:** None.

**Files:**
- Create: `apps/backend/src/utils/search-indexer/search-indexer.module.ts` — `@Global()` so any domain module can inject `SearchIndexerService` without explicit import.
- Create: `apps/backend/src/utils/search-indexer/search-indexer.service.ts`
- Create: `apps/backend/src/utils/search-indexer/search-indexes.constants.ts` — index-name constants only (`PLAN_INDEX`, `FICHE_INDEX`, `INDICATEUR_INDEX`, `ACTION_INDEX`) plus per-index settings declarations. **Queue name constants are NOT here** — they're declared inside each domain's indexer service (see U3–U6), matching the existing reports-queue precedent in `apps/backend/src/plans/reports/generate-plan-report-pptx/generate-reports.application-service.ts` line 31.
- Create: `apps/backend/src/utils/search-indexer/search-error.util.ts`
- Modify: `apps/backend/src/utils/config/configuration.model.ts` — add `MEILI_HOST`, `MEILI_MASTER_KEY` config keys.
- Modify: `apps/backend/package.json` — add `meilisearch` (>= 0.57.0) dependency.
- Modify: `apps/backend/src/app.module.ts` — register `SearchIndexerModule` (global).
- Test: `apps/backend/src/utils/search-indexer/search-indexer.service.e2e-spec.ts`

**Approach:**
- `SearchIndexerService` exposes `upsert(indexName, doc)`, `bulkUpsert(indexName, docs)`, `delete(indexName, id)`, `bulkDelete(indexName, ids)`, `multiSearch(queries)`, `swapIndexes([{ indexes: [a, b] }])`, `ensureIndexSettings(indexName, settings)`. No domain knowledge.
- `ensureIndexSettings` is invoked once per index at startup (`onApplicationBootstrap`) and applies the per-index settings declared in `search-indexes.constants.ts`. Each index has its own `searchableAttributes` (in priority order — earlier attributes rank higher), `filterableAttributes`, and `localizedAttributes` aligned with the document schemas in U2 (the user-specified field lists):
  - **`plans`** (sourced from `axe` table — every axe row, not only roots; `parentId IS NULL` distinguishes top-level plans from sub-axes):
    - `searchableAttributes: ['nom']`
    - `filterableAttributes: ['collectivite_id', 'parent_id']`
  - **`fiches`** (sourced from `fiche_action` table — both Actions and Sous-actions in one index):
    - `searchableAttributes: ['titre', 'description']`
    - `filterableAttributes: ['visible_collectivite_ids', 'parent_id']`
  - **`indicateurs`** (sourced from `indicateur_definition` table):
    - `searchableAttributes: ['identifiant_referentiel', 'titre', 'titre_long', 'description']`
    - `filterableAttributes: ['collectivite_id', 'groupement_id']`
  - **`actions`** (sourced from `action_definition` × `action_commentaire` per (action, collectivité) — UI "Mesures"):
    - `searchableAttributes: ['nom', 'description', 'commentaire']`
    - `filterableAttributes: ['collectivite_id', 'referentiel_id', 'type']`
  - **`documents`** (sourced from `bibliotheque_fichier` table):
    - `searchableAttributes: ['filename']`
    - `filterableAttributes: ['collectivite_id']`
  - All five indexes: `localizedAttributes: [{ attributePatterns: ['titre', 'titre_*', 'nom', 'description', 'commentaire', 'filename'], locales: ['fra'] }]`
- Settings are idempotent; re-applying is fast and safe. `ensureIndexSettings` is also re-invoked from the admin rebuild path (U8) on the temp index before swap.
- Index name constants live in `search-indexes.constants.ts` (`PLAN_INDEX = 'plans'`, etc.), imported by per-domain indexers and the read-side service.
- `classifyMeilisearchError(err)` from `search-error.util.ts` switches on `err.code` (not message text). Maps permanent codes to `UnrecoverableError`; everything else re-thrown.
- Env config validated in `configuration.model.ts` via the existing pattern (Zod). Wrapper reads through `ConfigService`.
- The SDK is HTTP-only — no `onModuleInit` connection needed. A `client.health()` call in `onApplicationBootstrap` logs health status but does not throw (Meilisearch outage at boot should not crash the backend).

**Patterns to follow:**
- Module-as-global pattern: see `@Global()` on [apps/backend/src/utils/utils.module.ts](../../apps/backend/src/utils/utils.module.ts).
- Service shape with logger + injected config: see [apps/backend/src/utils/webhooks/webhook.service.ts](../../apps/backend/src/utils/webhooks/webhook.service.ts).
- Static `DEFAULT_JOB_OPTIONS`: see `WebhookService.DEFAULT_JOB_OPTIONS`.

**Test scenarios:**
- Happy path: `upsert` and `delete` round-trip succeed against a real Meilisearch instance. (Use a test instance in CI or a Docker-compose fixture.)
- Happy path: `multiSearch` with two index queries returns two buckets with the right hits.
- Happy path: `swapIndexes` swaps two indexes atomically.
- Edge case: `ensureIndexSettings` on a brand-new index creates it. On an existing index with the same settings, it's a no-op.
- Error path: passing an invalid filter raises a permanent error; `classifyMeilisearchError` returns an `UnrecoverableError`.
- Error path: simulated network failure (use a wrong host) raises a `MeiliSearchCommunicationError`; classifier marks it retryable.
- Edge case: `bulkUpsert` of 1000 documents in batches of 500 (configurable batch size).

**Verification:**
- The four index-name constants (`PLAN_INDEX`, `FICHE_INDEX`, `INDICATEUR_INDEX`, `ACTION_INDEX`) are exported from `search-indexes.constants.ts`. Queue-name constants live in the per-domain indexer services per U3–U6.
- `MEILI_HOST` / `MEILI_MASTER_KEY` are validated config keys.
- A simple `await app.get(SearchIndexerService).health()` call returns `{ status: 'available' }` against a running Meilisearch.
- All four queues appear in the BasicAuth-protected Bull-Board UI when the backend boots — confirm by checking the existing Bull-Board configuration covers any registered queue (vs an explicit allowlist) and add a smoke test if needed.
- All test scenarios pass.

---

- U2. **Search Zod schemas in `packages/domain`**

**Goal:** Define request, response, and per-index document schemas in `packages/domain/src/search/` so backend procedures and frontend types stay in lockstep.

**Requirements:** R1, R2, R3, R5, R6.

**Dependencies:** U1 (uses index name constants — though those can be re-exported here too).

**Files:**
- Create: `packages/domain/src/search/search-request.schema.ts`
- Create: `packages/domain/src/search/search-response.schema.ts`
- Create: `packages/domain/src/search/search-document.schema.ts`
- Create: `packages/domain/src/search/index.ts` (re-exports)
- Modify: `packages/domain/src/index.ts` (or equivalent root re-export)

**Approach:**
- `SearchRequestSchema`: `{ query: z.string().min(1).max(200), collectiviteId: z.number().int().positive(), enabledIndexes: z.array(z.enum(['plans', 'fiches', 'indicateurs', 'actions', 'documents'])).min(1), exclusiveMode: z.boolean().default(false), ficheParentFilter: z.enum(['all', 'top-level', 'sous-action']).default('all'), limit: z.number().int().min(1).max(50).default(20) }`. The frontend always sends an explicit `ficheParentFilter` value derived from the chip toggle state (Actions chip alone → `'top-level'`, Sous-actions chip alone → `'sous-action'`, both or neither → `'all'`); the `.default('all')` applies only to direct API callers that omit it.
- `SearchResponseSchema`: a discriminated bucket shape `{ buckets: { plans: BucketSchema, fiches: BucketSchema, indicateurs: BucketSchema, actions: BucketSchema, documents: BucketSchema }, totalHits: z.number() }` where each `BucketSchema` is `{ hits: z.array(SearchHitSchema), estimatedTotalHits: z.number(), processingTimeMs: z.number() }`. `SearchHitSchema` carries `{ id, title, snippet, type, contextFields }` with `_formatted` highlight markup preserved in `title` and `snippet`.
- Per-document schemas. Field lists below match the user-specified set; `collectivite_id` (or `visible_collectivite_ids` for fiches) is included on every per-collectivité document for tenant filtering — explicitly added on top of the user's set for fiches since the user-specified fields alone do not enable secure tenant filtering.

  **`PlanDocSchema`** (sourced from `axe` table — every axe row, top-level plans and sub-axes; `parent_id IS NULL` distinguishes root plans):
  ```
  {
    id: number,                              // axe.id
    collectivite_id: number,                 // axe.collectiviteId — tenant filter
    nom: string,                             // axe.nom
    parent_id: number | null,                // axe.parent
  }
  ```

  **`FicheDocSchema`** (sourced from `fiche_action` table — both Actions and Sous-actions in one index):
  ```
  {
    id: number,                              // fiche_action.id
    titre: string,                           // fiche_action.titre
    description: string | null,              // fiche_action.description
    parent_id: number | null,                // fiche_action.parentId — Action when null, Sous-action when set
    visible_collectivite_ids: number[],      // [owner.collectiviteId, ...sharing rows.collectiviteId] — multi-valued tenant filter; required for security; added on top of the user-specified field list
  }
  ```

  **`IndicateurDocSchema`** (sourced from `indicateur_definition` table):
  ```
  {
    id: number,                              // indicateur_definition.id
    identifiant_referentiel: string | null,  // indicateur_definition.identifiantReferentiel
    collectivite_id: number | null,          // null = predefined / global; set = custom
    groupement_id: number | null,            // indicateur_definition.groupementId
    titre: string,                           // indicateur_definition.titre
    titre_long: string | null,               // indicateur_definition.titreLong
    description: string | null,              // indicateur_definition.description
  }
  ```

  **`ActionDocSchema`** (sourced from `action_definition` × `action_commentaire`, one document per (action × activated collectivité) — UI "Mesures"):
  ```
  {
    id: string,                              // composite primary key: '${action_definition.actionId}:${collectivite_id}' — e.g. 'cae_1.1:42'
    collectivite_id: number,                 // tenant filter
    action_id: string,                       // action_definition.actionId (e.g. 'cae_1.1') — preserved separately for navigation
    referentiel_id: string,                  // action_definition.referentielId
    type: string,                            // ActionType enum — 'referentiel' | 'axe' | 'sous-axe' | 'action' | 'sous-action' | 'tache' | 'exemple'; derived via getActionTypeFromActionId(actionId, hierarchie)
    nom: string,                             // action_definition.nom
    description: string,                     // action_definition.description
    commentaire: string | null,              // action_commentaire.commentaire — null when the collectivité has activated the referentiel but not yet annotated this action
  }
  ```

  **`DocumentDocSchema`** (sourced from `bibliotheque_fichier` table):
  ```
  {
    id: number,                              // bibliotheque_fichier.id
    collectivite_id: number | null,          // bibliotheque_fichier.collectiviteId — nullable; null = global / system file
    filename: string,                        // bibliotheque_fichier.filename
  }
  ```

  **Note on the composite primary key for actions:** Meilisearch documents are keyed by a single primary-key field. To support per-(action × collectivité) docs, `actions.id` is a composite string `'${actionId}:${collectiviteId}'`. The original `actionId` is preserved as a separate non-key field for navigation.

  **Note on naming:** referentiel actions use `nom` for the title-equivalent field (matching the `action_definition` column); the other entities use `titre`. The result-row component layer maps both to a generic display field.

  **Note on `visible_collectivite_ids` for fiches:** the user-specified field list (`id, titre, description, parent_id`) does not include a tenant scope. Tenant filtering is mandatory for security, so the indexer also writes `visible_collectivite_ids: number[]` (owner + every `fiche_action_sharing` target). The proxy filters with `visible_collectivite_ids = ${activeId}`. This addition is surfaced explicitly so it can be reviewed and adjusted if the intended model is different.

**Patterns to follow:**
- Existing Zod-in-domain pattern: [packages/domain/src/referentiels/actions/list-actions.request.ts](../../packages/domain/src/referentiels/actions/list-actions.request.ts) and adjacent files.

**Test scenarios:**
- Happy path: a valid request payload parses successfully.
- Edge case: empty `query` is rejected (min(1)).
- Edge case: `query` of 201 chars is rejected (max(200)).
- Edge case: `enabledIndexes: []` is rejected (min(1)).
- Happy path: a `FicheDoc` with `parent_id: null` parses; same with `parent_id: 42`.
- Happy path: `IndicateurDoc` with `collectivite_id: null` parses (predefined indicateur).
- Happy path: a `DocumentDoc` with `collectivite_id: null` parses (global file); same with `collectivite_id: 42`.

**Verification:**
- All schemas exported from `packages/domain/src/search/index.ts`.
- Backend imports work without circular dependency issues.
- All test scenarios pass.

---

- U3. **PlanIndexerService + write-path enqueues**

**Goal:** Index plans on create / update / delete and on plan-aggregate / import-plan flows.

**Requirements:** R1, R4, R7, R8.

**Dependencies:** U1, U2.

**Files:**
- Create: `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.ts`
- Modify: `apps/backend/src/plans/plans/plans.module.ts` — `BullModule.registerQueue({ name: SEARCH_INDEXING_PLAN_QUEUE_NAME })`, register `PlanIndexerService` provider.
- Modify: `apps/backend/src/plans/plans/upsert-plan/upsert-plan.service.ts` — enqueue upsert after commit.
- Modify: `apps/backend/src/plans/plans/delete-plan/delete-plan.service.ts` — enqueue delete after commit (and enqueue deletes for cascaded fiches via the `FicheIndexerService` injected helper, or rely on `DeleteFicheService` to do its own enqueue — see Approach).
- Modify: `apps/backend/src/plans/plans/create-plan-aggregate/create-plan-aggregate.service.ts` — enqueue plan upsert and per-fiche upserts after commit.
- Modify: `apps/backend/src/plans/plans/import-plan-aggregate/import-plan.application-service.ts` — same as create.
- Test: `apps/backend/src/plans/plans/plan-indexer/plan-indexer.service.e2e-spec.ts`

**Approach:**
- `PlanIndexerService` is `@Injectable()` and `@Processor(SEARCH_INDEXING_PLAN_QUEUE_NAME) extends WorkerHost`. Constructor injects `DatabaseService`, `SearchIndexerService`, and the queue (`@InjectQueue(...)`) for self-enqueue (used by `indexAll`). The queue-name constant is declared at the top of `plan-indexer.service.ts`: `export const SEARCH_INDEXING_PLAN_QUEUE_NAME = 'search-indexing-plan';` — matching the reports module's precedent of declaring queue names inside the application-service file rather than in `apps/backend/src/utils/bullmq/queue-names.constants.ts`. Module-level `BullModule.registerQueue({ name: SEARCH_INDEXING_PLAN_QUEUE_NAME })` is added to `plans.module.ts` imports.
- `process(job)` reads `{op, entityId}` from `job.data`; if `op === 'upsert'`, loads the canonical row from the `axe` table (every axe — top-level plans and sub-axes — not just roots; the user's chosen field list includes `parent_id` precisely so the proxy can support hierarchy filtering or breadcrumb rendering), maps to `PlanDocSchema` (U2 fields: `id`, `collectivite_id`, `nom`, `parent_id`), calls `searchIndexer.upsert(PLAN_INDEX, doc)`. If `op === 'delete'`, calls `searchIndexer.delete(PLAN_INDEX, entityId)`. Errors classified via `classifyMeilisearchError`.
- `enqueueUpsert(planId, queue?)` and `enqueueDelete(planId, queue?)` are public methods on the service so write-path callers don't have to interact with BullMQ directly.
- `indexAll(): Promise<void>` exposed for backfill (called from U8): paginates through all plans, batches `bulkUpsert` calls of 500 docs.
- Plan-aggregate and import flows: enqueue the plan + delegate to `FicheIndexerService.enqueueUpsert(...)` for each created/imported fiche (forward dependency on U4 — both ship together in this phase, see sequencing).
- `delete-plan.service.ts` cascades fiche deletes via `DeleteFicheService`. `DeleteFicheService` already (will) enqueue fiche deletes in U4. Plan delete only needs to enqueue itself.

**Patterns to follow:**
- Worker class shape: [apps/backend/src/plans/reports/generate-plan-report-pptx/generate-reports.worker.ts](../../apps/backend/src/plans/reports/generate-plan-report-pptx/generate-reports.worker.ts).
- Module providers + queue registration: [apps/backend/src/plans/reports/reports.module.ts](../../apps/backend/src/plans/reports/reports.module.ts).
- Enqueue post-commit: see how [apps/backend/src/plans/fiches/update-fiche/update-fiche.service.ts](../../apps/backend/src/plans/fiches/update-fiche/update-fiche.service.ts) line 472 already calls `webhookService.sendWebhookNotification` — model the indexer enqueue immediately next to it.

**Test scenarios:**
- Happy path: creating a plan via `upsertPlan` enqueues an upsert; processor indexes the doc; querying Meilisearch returns the plan.
- Happy path: updating a plan re-enqueues; index reflects the new title.
- Happy path: deleting a plan enqueues a delete; index no longer returns it.
- Edge case: creating a plan-aggregate with 5 fiches enqueues 1 plan upsert + 5 fiche upserts.
- Integration: `delete-plan` triggers `delete-fiche` for cascaded fiches; both plan and child fiches are gone from their indexes.
- Error path: Meilisearch unavailable → BullMQ retries; eventually permanent error wraps with `UnrecoverableError`.
- Edge case: `indexAll()` on an empty DB completes without error.
- Edge case: `indexAll()` with 1500 plans completes in 3 batches of 500.
- Covers R8. Soft-delete (if applicable to plans) enqueues a delete, not an upsert.

**Verification:**
- The `search-indexing-plan` queue is registered and processed.
- All test scenarios pass.
- Searching for a plan title via the read-side proxy returns the plan within 5 seconds of creation.

---

- U4. **FicheIndexerService + write-path enqueues** (most complex)

**Goal:** Index fiches with `visible_collectivite_ids` (owner + sharing targets) and `parent_fiche_id`. Cover all write paths: create, update, delete (with parent-cascade), bulk-edit, share/unshare.

**Requirements:** R1, R2 (parent_fiche_id filter), R4 (cross-collectivité incl. sharing), R7, R8.

**Dependencies:** U1, U2.

**Files:**
- Create: `apps/backend/src/plans/fiches/fiche-indexer/fiche-indexer.service.ts`
- Modify: `apps/backend/src/plans/fiches/fiches.module.ts` — `BullModule.registerQueue({ name: SEARCH_INDEXING_FICHE_QUEUE_NAME })`, register `FicheIndexerService` provider. Queue-name constant `export const SEARCH_INDEXING_FICHE_QUEUE_NAME = 'search-indexing-fiche';` is declared at the top of `fiche-indexer.service.ts` (same pattern as U3).
- Modify: `apps/backend/src/plans/fiches/create-fiche/create-fiche.service.ts` — enqueue upsert after commit.
- Modify: `apps/backend/src/plans/fiches/update-fiche/update-fiche.service.ts` — enqueue upsert after commit.
- Modify: `apps/backend/src/plans/fiches/delete-fiche/delete-fiche.service.ts` — collect parent + child ids before delete, enqueue per-id delete after commit.
- Modify: `apps/backend/src/plans/fiches/bulk-edit/bulk-edit.service.ts` — enqueue upserts for each touched fiche.
- Modify: `apps/backend/src/plans/fiches/share-fiches/share-fiche.service.ts` — `shareFiche` and `bulkShareFiches` enqueue upserts for each affected fiche so `visible_collectivite_ids` updates.
- Test: `apps/backend/src/plans/fiches/fiche-indexer/fiche-indexer.service.e2e-spec.ts`

**Approach:**
- Document loader reads `fiche_action` (filtered to `deleted = false` — never load a soft-deleted row for upsert) joined with `fiche_action_sharing` to produce a `FicheDocSchema` (U2): `id`, `titre`, `description`, `parent_id` (= `fiche_action.parentId`), and `visible_collectivite_ids: [owner.collectiviteId, ...sharing rows.collectiviteId]` (added on top of the user-specified set for tenant security). If the loader query returns zero rows for an upsert message (entity has been deleted in the meantime), the processor logs and treats it as a no-op (the corresponding delete job is or will be on the queue).
- `delete-fiche.service.ts` parent cascade: before issuing the DB delete, run a query `SELECT id FROM fiche_action WHERE id = $1 OR parent_id = $1`, hold the list, run the cascade delete in the existing transaction, then after commit enqueue one delete job per id. Same enqueue rule applies to soft-delete (mode `'soft'`): even though the row stays in the DB with `deleted = true`, the index gets a delete op so search never has to filter on `deleted`.
- `share-fiche.service.ts`: after the DB write, enqueue an upsert for the fiche id(s) whose sharing list changed. For `bulkShareFiches`, enqueue per affected id (use `addBulk`).
- **Sharing-recovery sweep cron.** A `@Cron('0 * * * *')` (hourly) job in `FicheIndexerService` queries `fiche_action_sharing` for rows created or deleted in the last hour (using `created_at` and a soft-delete or audit mechanism — implementer to confirm the right query against the existing schema), collects the affected `fiche_id`s, and enqueues an upsert per id. This caps the worst-case "stale `visible_collectivite_ids` after a failed enqueue" window at ~1 hour even when Redis loses jobs (per ADR 0006). Without this sweep, an unshare event whose enqueue silently fails leaves the fiche visible to the ex-recipient until the next manual admin backfill — unacceptable for a permission-revocation pathway.

**Execution note:** Test-first for the cross-collectivité sharing scenario — write the failing e2e first that creates a fiche in collectivité A, shares with B, asserts user B finds it via search, then implement the indexer + enqueue logic to make it green.

**Patterns to follow:**
- Same as U3.
- Sharing table schema: [apps/backend/src/plans/fiches/share-fiches/fiche-action-sharing.table.ts](../../apps/backend/src/plans/fiches/share-fiches/fiche-action-sharing.table.ts).

**Test scenarios:**
- Happy path: creating a fiche enqueues upsert; doc indexed with `visible_collectivite_ids: [ownerCollectiviteId]`, `parent_fiche_id: null`.
- Happy path: creating a sub-fiche (with parent) enqueues upsert; doc has `parent_fiche_id: <parent>` and `parent_fiche_title` denormalized.
- Edge case: updating a fiche's title re-enqueues; new title appears in Meilisearch.
- Edge case: bulk-edit of 50 fiches enqueues 50 jobs (deduped if same fiche edited twice in flight).
- Integration: delete a parent fiche with 3 children → 4 delete jobs enqueued; all 4 absent from index after processing.
- Integration: soft-delete enqueues `delete` op, not an upsert with `deleted=true`.
- Integration (CRITICAL): create fiche in collectivité A, share with B → fiche searchable in B's modal. Unshare → fiche disappears from B's results within seconds (or within ≤ 1 hour worst case via the sweep cron if the enqueue fails).
- Integration: simulate an enqueue failure on unshare (e.g. by killing Redis between the DB commit and the enqueue) → the hourly sharing-recovery sweep enqueues the corrective upsert; ex-recipient stops seeing the fiche after the next sweep tick.
- Edge case: a user of B searches *before* the share's enqueue runs — should not yet see the fiche (eventual consistency, acceptable).
- Error path: parent-cascade query fails before DB delete commits → no jobs enqueued, DB state unchanged.
- Error path: parent-cascade query succeeds but BullMQ enqueue fails after DB commit → drift; admin backfill recovers (this is the "small gap" risk documented).
- Covers R4. Cross-collectivité isolation: a fiche in collectivité A *not* shared is not searchable from B.
- Covers R2. `parent_fiche_id IS NULL` filter returns only top-level fiches; `IS NOT NULL` returns only sous-actions.

**Verification:**
- The `search-indexing-fiche` queue is registered and processed.
- All test scenarios pass, including the cross-collectivité sharing scenario.
- Manual: ⌘K, type a known fiche title in collectivité A, see it. Switch to collectivité B (without sharing), don't see it. Share → see it.

---

- U5. **IndicateurIndexerService + write-path enqueues**

**Goal:** Index indicateur definitions (predefined and custom) with nullable `collectivite_id`.

**Requirements:** R1, R5, R7, R8.

**Dependencies:** U1, U2.

**Files:**
- Create: `apps/backend/src/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service.ts`
- Modify: `apps/backend/src/indicateurs/indicateurs.module.ts` — `BullModule.registerQueue({ name: SEARCH_INDEXING_INDICATEUR_QUEUE_NAME })`, register `IndicateurIndexerService` provider. Queue-name constant declared at the top of `indicateur-indexer.service.ts`: `export const SEARCH_INDEXING_INDICATEUR_QUEUE_NAME = 'search-indexing-indicateur';`.
- Modify: `apps/backend/src/indicateurs/definitions/mutate-definition/create-definition.service.ts` — enqueue upsert.
- Modify: `apps/backend/src/indicateurs/definitions/mutate-definition/update-definition.service.ts` — enqueue upsert.
- Modify: `apps/backend/src/indicateurs/definitions/mutate-definition/delete-definition.service.ts` — enqueue delete.
- Modify: `apps/backend/src/indicateurs/import-indicateurs/import-indicateur-definition.service.ts` — enqueue upsert per imported definition.
- Test: `apps/backend/src/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service.e2e-spec.ts`

**Approach:**
- Document loader reads `indicateur_definition` (no joins required for the user-specified field list). Resulting `IndicateurDocSchema` (U2): `id`, `identifiant_referentiel`, `collectivite_id` (nullable — null for predefined / global), `groupement_id`, `titre`, `titre_long`, `description`.

**Patterns to follow:** Same as U3.

**Test scenarios:**
- Happy path: creating a custom indicateur enqueues upsert; doc has `collectivite_id` set, `is_personnalise: true`.
- Happy path: importing a predefined indicateur via `ImportIndicateurDefinitionService` enqueues upsert; doc has `collectivite_id: null`.
- Edge case: deleting a custom indicateur enqueues delete.
- Integration: cross-collectivité — predefined indicateur is searchable from any collectivité; custom indicateur in A is not visible from B.
- Covers R5. Predefined indicateurs are global; custom are scoped.

**Verification:**
- The `search-indexing-indicateur` queue is registered and processed.
- All test scenarios pass.

---

- U6. **ActionIndexerService — per-(action × collectivité) indexing, hooks on commentaire CRUD + referentiel imports + activation events**

**Goal:** Index referentiel `action_definition` rows (UI "Mesures") *per activated collectivité*, denormalizing `action_commentaire.commentaire` into each document. Hook into commentaire CRUD, referentiel imports, and collectivité activation events to keep the index current.

**Requirements:** R1, R6, R7.

**Dependencies:** U1, U2.

**Files:**
- Create: `apps/backend/src/referentiels/action-indexer/action-indexer.service.ts`
- Modify: `apps/backend/src/referentiels/referentiels.module.ts` (or `referentiels-core.module.ts` as appropriate) — `BullModule.registerQueue({ name: SEARCH_INDEXING_ACTION_QUEUE_NAME })`, register `ActionIndexerService` provider. Queue-name constant declared at the top of `action-indexer.service.ts`: `export const SEARCH_INDEXING_ACTION_QUEUE_NAME = 'search-indexing-action';`.
- Modify: `apps/backend/src/referentiels/update-action-commentaire/` — enqueue an upsert for the (action, collectivité) pair when commentaire is created/updated.
- Modify: the service that deletes an `action_commentaire` row (find via grep on `actionCommentaireTable` deletes) — enqueue an upsert (the doc keeps the action content, just nulls out the commentaire) rather than a delete (the doc may still be valid for the activated collectivité).
- Modify: `apps/backend/src/referentiels/import-referentiel/import-referentiel.service.ts` — after a successful re-import, enqueue a "fanout this referentiel" job that, in the processor, expands to one upsert per (action × collectivité-that-activated-this-referentiel) pair.
- Modify: the activation hook (when a collectivité first scores a referentiel, indicated by the first `client_scores` row) — enqueue a per-action upsert fanout for that (referentiel × collectivité) pair. Implementer to identify the right hook point during U6 work — likely in the referentiel scoring or labellisation flow.
- Test: `apps/backend/src/referentiels/action-indexer/action-indexer.service.e2e-spec.ts`

**Approach:**
- Document loader: `action_definition` LEFT JOIN `action_commentaire` (on `action_id` and the target `collectivite_id`). Resulting `ActionDocSchema` (U2): composite `id = '${actionId}:${collectiviteId}'`, `collectivite_id`, `action_id`, `referentiel_id`, `type` (= ActionType derived via `getActionTypeFromActionId(actionId, hierarchie)` — values: `referentiel | axe | sous-axe | action | sous-action | tache | exemple`), `nom`, `description`, `commentaire` (nullable). The `addDocuments` call passes `primaryKey: 'id'` so Meilisearch keys on the composite string.
- **What constitutes "activated"** for the purposes of generating per-collectivité documents: the implementer should pick the most accurate signal. The recommended one is "the collectivité has at least one row in `client_scores` for the referentiel" — that's the canonical "engaged with this referentiel" signal. Document the chosen signal in the service.
- **Hook points and their behaviors:**
  - `action_commentaire` create/update → upsert one doc for `(action_id, collectivite_id)` with the new commentaire denormalized.
  - `action_commentaire` delete → upsert (not delete) the doc with `commentaire: null` (the action stays in the index for that collectivité as long as they're activated; the doc is just freshened to drop the commentaire).
  - Referentiel re-import → enqueue a single "fanout-referentiel" job that in the processor does: for each (action_definition.actionId in this referentiel) × (each collectivité activated on this referentiel), batch upsert via `bulkUpsert`. Avoids flooding the queue with millions of small jobs.
  - Collectivité-activates-a-referentiel hook → enqueue a "fanout-activation" job that in the processor does: for each action of the referentiel, upsert a doc for (action × this collectivité) with `commentaire: null`.
  - Collectivité-removed-from-referentiel (rare; may not exist as a flow) — out of scope for v1; admin `mode: 'rebuild'` cleans up.
- After a referentiel re-import that *removes* an action, the fanout will not catch the removal. v1 handles this via the admin `mode: 'rebuild'` backfill in U8 — operators run it after a referentiel import that removed entries.
- **Index size estimate:** for ~3000 action_definition rows × an upper bound of ~5000 active-on-each-referentiel collectivités = ~15M docs in the worst case. In practice we expect dramatically fewer (most collectivités activate one or two referentiels). Meilisearch handles this scale comfortably on Koyeb provisioning, but operators should monitor index size and be prepared to vertically scale if real traffic warrants.

**Patterns to follow:** Same as U3.

**Test scenarios:**
- Happy path: collectivité A activates referentiel CAE → fanout job runs → docs exist for (every CAE action × A) with `commentaire: null`. Searching by an action's `nom` from collectivité A returns the doc.
- Happy path: collectivité A adds an `action_commentaire` to an action → upsert refreshes the (action × A) doc with the commentaire denormalized.
- Happy path: search query matching commentaire text (e.g. user typed a keyword they wrote in their own annotation) returns the action with the commentaire highlighted.
- Integration (CRITICAL — cross-collectivité isolation): collectivité B searches the same query → does NOT see A's commentaire-bearing docs (filter `collectivite_id = B`). If B has activated the same referentiel, B sees its own docs (with B's commentaire or null).
- Integration: collectivité B has not activated CAE → searching a CAE action title returns nothing in the actions bucket. (This is the discovery loss documented as a deferred question.)
- Edge case: deleting an `action_commentaire` row → the (action × collectivité) doc is upserted with `commentaire: null`, NOT deleted. The action is still searchable for the collectivité.
- Edge case: a referentiel re-import with 1500 actions × 500 activated collectivités = 750k docs to upsert. Completes in batches of 500 with bounded memory.
- Error path: a single bad doc in a batch causes the whole batch to be retried (Meilisearch's behavior); the implementer should chunk smaller on retry if a single batch keeps failing.
- Integration: result row shows `referentiel_label` for a hit (denormalization works end-to-end).

**Verification:**
- The `search-indexing-action` queue is registered and processed.
- All test scenarios pass.

---

- U7. **Search tRPC router (read-side proxy)**

**Goal:** Expose `search.query` as an `authedProcedure` that fans out to Meilisearch via `multiSearch`, injects per-index tenant filters, and returns shaped results with `_formatted` highlights.

**Requirements:** R1, R2, R3, R4, R5, R6, R11.

**Dependencies:** U1, U2.

**Files:**
- Create: `apps/backend/src/search/search.router.ts`
- Create: `apps/backend/src/search/search.service.ts`
- Modify: `apps/backend/src/search/search.module.ts` — register router/service.
- Modify: `apps/backend/src/utils/trpc/trpc.router.ts` — merge `searchRouter` under `search:` key.
- Test: `apps/backend/src/search/search.router.e2e-spec.ts`

**Approach:**
- `search.query`: `authedProcedure.input(SearchRequestSchema).output(SearchResponseSchema).query(async ({ ctx, input }) => searchService.search(ctx.user, input))`. The procedure is decorated with `@Throttle({ default: { limit: 60, ttl: 60000 } })` (per-user 60 req/min) following the `@nestjs/throttler` convention.
- `searchService.search(user, input)`:
  1. Resolve `isPrivate = await collectiviteService.isPrivate(input.collectiviteId)`. Pick the permission op accordingly: `PermissionOperationEnum['COLLECTIVITES.READ_CONFIDENTIEL']` if private, else `PermissionOperationEnum['COLLECTIVITES.READ']`.
  2. Verify the user has the resolved permission for `input.collectiviteId` via `permissionService.isAllowed(user, op, ResourceType.COLLECTIVITE, collectiviteId)`. Throw FORBIDDEN otherwise — this gate is per-request, so a user blocked here cannot reach `multiSearch` and cannot leak any document from this collectivité regardless of what's indexed.
  3. Build per-index filter via `buildTenantFilter(input.collectiviteId, indexName, input.ficheParentFilter)`.
  4. Construct `multiSearch` queries for each enabled index with `q: input.query`, `filter`, and the per-index highlight/crop params aligned with the U2 doc schemas:
     - `plans`: `attributesToHighlight: ['nom']`, `attributesToCrop: []`
     - `fiches`: `attributesToHighlight: ['titre', 'description']`, `attributesToCrop: ['description:30']`
     - `indicateurs`: `attributesToHighlight: ['identifiant_referentiel', 'titre', 'titre_long', 'description']`, `attributesToCrop: ['description:30']`
     - `actions`: `attributesToHighlight: ['nom', 'description', 'commentaire']`, `attributesToCrop: ['description:30', 'commentaire:30']`
     - `documents`: `attributesToHighlight: ['filename']`, `attributesToCrop: []`
     - All five use `highlightPreTag: '<mark>'`, `highlightPostTag: '</mark>'`, `limit: input.limit`.
  5. Call `searchIndexer.multiSearch(queries)`.
  6. Reshape per-bucket Meilisearch results into `SearchResponse` with `_formatted` mapped onto the hit's title/snippet fields.
- The proxy gate is the *only* `accesRestreint` enforcement point: the indexer does not denormalize a per-document `acces_restreint` flag because search is always scoped to one collectivité per request.
- `buildTenantFilter` rules:
  - `plans` → `collectivite_id = ${id}`
  - `fiches` → `visible_collectivite_ids = ${id}` plus optional `AND parent_id IS NULL` / `IS NOT NULL` based on `ficheParentFilter`
  - `indicateurs` → `(collectivite_id IS NULL OR collectivite_id = ${id})`
  - `actions` → `collectivite_id = ${id}` (mesures are now per-collectivité, see Architecture Decision #4 / R6)
  - `documents` → `(collectivite_id IS NULL OR collectivite_id = ${id})` — same nullable pattern as indicateurs
- Bound user input: strip control chars (`input.query.replace(/[\x00-\x1F\x7F]/g, '')`) before passing to Meilisearch.
- Error handling: Meilisearch unavailable → throw `INTERNAL_SERVER_ERROR` with a stable code; don't leak Meilisearch internals.

**Patterns to follow:**
- Router shape: [apps/backend/src/plans/plans/list-plans/list-plans.router.ts](../../apps/backend/src/plans/plans/list-plans/list-plans.router.ts).
- Permission check inside service: [apps/backend/src/referentiels/list-actions/list-actions.service.ts](../../apps/backend/src/referentiels/list-actions/list-actions.service.ts).

**Test scenarios:**
- Happy path: search "carbone" with all chips enabled returns buckets for plans/fiches/indicateurs/actions. Buckets carry `_formatted` markup with `<mark>...</mark>` around matched terms.
- Happy path (Sous-actions filter): `enabledIndexes: ['fiches']`, `ficheParentFilter: 'sous-action'` returns only sub-fiches.
- Happy path (Actions filter): `enabledIndexes: ['fiches']`, `ficheParentFilter: 'top-level'` returns only top-level fiches.
- Happy path (mode exclusif): `enabledIndexes: ['actions']` returns only the actions bucket.
- Integration (CRITICAL — cross-collectivité isolation): user A queries with `collectiviteId: A`. Fiches/plans/custom-indicateurs of B are NOT in the response. Predefined indicateurs and referentiel actions ARE.
- Integration (CRITICAL — sharing): a fiche shared from A to B is in B's results.
- Integration (CRITICAL — accesRestreint): a confidential collectivité C; user without `COLLECTIVITES.READ_CONFIDENTIEL` for C gets FORBIDDEN, no result body returned. User with the permission gets the expected results.
- Edge case: empty result set returns buckets with empty `hits` arrays, not 404.
- Edge case: query of length 200 succeeds; 201 fails Zod validation.
- Edge case: control chars in query are stripped before Meilisearch call.
- Error path: user without access to `collectiviteId` gets FORBIDDEN.
- Error path: Meilisearch unreachable → INTERNAL_SERVER_ERROR with stable code; no internal info leaked.
- Edge case: query containing Meilisearch filter syntax (`'collectivite_id = 999'`) is treated as plain text, not parsed.
- Rate-limit: a 61st request within 60 s for the same user receives 429 TOO_MANY_REQUESTS.

**Verification:**
- `search.query` is callable from a test client.
- All test scenarios pass.
- Server-side response time < 200 ms for a typical query against a populated test index.

---

- U8. **Admin backfill endpoints (`upsert` and `rebuild` modes)**

**Goal:** Expose admin tRPC procedures `search.admin.reindexPlans`, `search.admin.reindexFiches`, `search.admin.reindexIndicateurs`, `search.admin.reindexActions`, each accepting `mode: 'upsert' | 'rebuild'`. Implement swap-indexes for rebuild + Redis lock.

**Requirements:** R9.

**Dependencies:** U3, U4, U5, U6, U7 (uses indexer services + multiSearch helper).

**Files:**
- Create: `apps/backend/src/search/search-admin.router.ts`
- Create: `apps/backend/src/search/search-admin.service.ts`
- Modify: `apps/backend/src/search/search.module.ts` — register admin router/service.
- Modify: `apps/backend/src/search/search.router.ts` — merge admin router as `admin:` sub-router.
- Test: `apps/backend/src/search/search-admin.router.e2e-spec.ts`

**Approach:**
- Each admin procedure is `authedProcedure.input(z.object({ mode: z.enum(['upsert', 'rebuild']).default('upsert') })).mutation(async ({ ctx, input }) => searchAdminService.reindex(ctx.user, 'plans' | 'fiches' | ..., input.mode))`. Each procedure is decorated with `@Throttle({ default: { limit: 5, ttl: 60000 } })` (5 req/min/user).
- Inside the service: gate via `permissionService.isAllowed(user, PermissionOperationEnum['COLLECTIVITES.MUTATE'], ResourceType.PLATEFORME, null)` — same enum + scope as the existing platform-admin precedent in [collectivite-crud.router.ts](../../apps/backend/src/collectivites/collectivite-crud/collectivite-crud.router.ts) lines 24–28. Throw FORBIDDEN otherwise. (There is no `PLATEFORME_MUTATE` enum value; `COLLECTIVITES.MUTATE` + `ResourceType.PLATEFORME` is the canonical pair.)
- **Recovery semantics for queue loss vs orphan cleanup are different.** Operators choose mode based on the recovery scenario:
  - `mode: 'upsert'` is the right tool for **recovering from queue loss / drift** (per ADR 0006, Redis is non-persistent on Koyeb). It re-indexes every entity by id without touching docs that are already correct, and does NOT lose any concurrent live writes — making it safe to run during normal traffic.
  - `mode: 'rebuild'` is the right tool for **orphan cleanup** (entities deleted from the DB but still in the index due to historical drift) and for **forced reindex after settings changes**. It writes to a temp index then atomically swaps; concurrent live writes that land on the live index *during* the rebuild are lost on swap. Operators run rebuild during low-traffic windows.
- `mode: 'upsert'`: call the corresponding indexer's `indexAll()` directly. Idempotent; concurrent calls are wasteful but safe.
- `mode: 'rebuild'`:
  1. Acquire a Redis lock keyed `search:rebuild:${indexName}` with TTL 30 min. If the lock is held, return `409 CONFLICT` with the elapsed time.
  2. Create a temporary index `${indexName}_v2`.
  3. **Explicitly call `searchIndexer.ensureIndexSettings('${indexName}_v2', settings)`** before any document writes — Meilisearch does NOT auto-copy settings between indexes at create time, so without this step the post-swap live index ends up with default ranking/filterable attributes and queries break.
  4. Call `indexAll()` against the temp index (passes a target index name override).
  5. After completion, call `searchIndexer.swapIndexes([{ indexes: [indexName, '${indexName}_v2'] }])`.
  6. Drop the now-old `${indexName}_v2`.
  7. Release the lock.
- Lock primitive: BullMQ already uses Redis; use `ioredis` directly via `BullModule`'s connection. Simple `SET NX EX` with the TTL is sufficient.

**Patterns to follow:**
- Admin gating with `ResourceType.PLATEFORME`: [apps/backend/src/collectivites/collectivite-crud/collectivite-crud.router.ts](../../apps/backend/src/collectivites/collectivite-crud/collectivite-crud.router.ts).

**Test scenarios:**
- Happy path: non-admin user calling `reindexPlans` gets FORBIDDEN.
- Happy path: admin calling `reindexFiches({ mode: 'upsert' })` re-indexes all fiches; Meilisearch reflects current DB state.
- Happy path: `reindexFiches({ mode: 'rebuild' })` rebuilds the index, swaps atomically, drops the temp.
- Edge case: an entity exists in Meilisearch but not in the DB (orphan) — `mode: 'upsert'` does not remove it; `mode: 'rebuild'` does.
- Concurrency: two admin calls of `mode: 'rebuild'` for the same index — second gets 409.
- Error path: rebuild fails halfway → temp index is left over; subsequent rebuild retries cleanly (lock released by TTL or explicit cleanup).
- Edge case: rebuild-during-live-writes — writes go to the live index; the rebuild only sees the snapshot at start. After swap, any writes that landed during the rebuild on the live index are lost. **Mitigation:** rebuild operations should be run during low-traffic windows; this is documented in the operational runbook.

**Verification:**
- All four admin procedures are callable.
- All test scenarios pass.
- A rebuild round-trip on a 1000-doc index completes in < 60 s.

---

- U9. **Global ⌘K shortcut + modal shell**

**Goal:** Add a global `useGlobalShortcut` hook, mount the search modal once in `authed-providers.tsx`, implement modal shell with input + chip row + footer.

**Requirements:** R1, R2.

**Dependencies:** U7 (search router callable).

**Files:**
- Create: `apps/app/src/search/use-global-search-shortcut.ts`
- Create: `apps/app/src/search/search-modal.tsx`
- Create: `apps/app/src/search/use-search-query.ts` (debounced tRPC query relying on react-query's built-in input-keyed query identity)
- Create: `apps/app/src/search/search-result-list.tsx` (list shell + keyboard nav stub; populated in U10)
- Modify: `apps/app/app/(authed)/authed-providers.tsx` — mount `<SearchModal />`.
- Test: `apps/app/src/search/__tests__/search-modal.test.tsx` (unit / RTL).

**Approach:**
- `useGlobalShortcut(combo, callback)` — adds a `keydown` listener on `window`, ignores if focus is inside an editable element (input/textarea/contenteditable) *unless* the user is in the modal already (modal Esc still closes).
- `<SearchModal />` is always mounted under `authed-providers.tsx`. Visibility controlled by an internal Zustand or React state. ⌘K toggles open/close.
- Modal shell: input (autofocus on open), 5 chip toggles, "Mode exclusif" toggle, footer hint.
- `useSearchQuery({ query, enabledIndexes, exclusiveMode, ficheParentFilter, collectiviteId })` wraps `useQuery(trpc.search.query.queryOptions({...}))`. Debounce the *input* (e.g. via `useDebounce(query, 150)`) before passing to the query options — react-query handles in-flight cancellation via input-keyed query identity and AbortController on the underlying fetch, so no manual sequence-id mechanism is needed. Stale responses are silently dropped by react-query's query-cache invalidation.
- Modal reads `useCollectiviteId()` reactively; clears results on collectivité change (the input change re-keys the query and react-query starts a fresh fetch).

**Patterns to follow:**
- Modal primitive: [packages/ui/src/design-system/Modal/Modal.tsx](../../packages/ui/src/design-system/Modal/Modal.tsx).
- tRPC + react-query: [apps/app/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/plans/tableau-de-bord/_hooks/use-fetch-modules.ts](../../apps/app/app/%28authed%29/collectivite/%5BcollectiviteId%5D/%28acces-restreint%29/plans/tableau-de-bord/_hooks/use-fetch-modules.ts).
- `<kbd>` styling: [apps/app/src/ui/shared/Kbd/index.tsx](../../apps/app/src/ui/shared/Kbd/index.tsx).

**Test scenarios:**
- Happy path: pressing ⌘K opens the modal; input is focused.
- Happy path: pressing Esc closes the modal.
- Edge case: typing "carbone" in the input fires a search after 150 ms debounce; no request is fired until user stops typing.
- Edge case: rapid typing fires multiple debounced requests; react-query's input-keyed identity ensures only the latest response is what's rendered (older queries are aborted by the underlying AbortController; their responses, if they arrive, are written to a stale cache key and not rendered).
- Edge case: pressing ⌘K while focus is in a textarea on the page still opens the modal (intentional override).
- Edge case: pressing ⌘K while modal is already open is a no-op or closes (pick one — recommend close).
- Edge case: collectivité changes mid-modal-open → results cleared, refetch with new id.
- Edge case: Mode exclusif toggle on + click chip → only that chip enabled; query re-runs.
- Edge case: Mode exclusif off → chips toggle independently.

**Verification:**
- ⌘K opens/closes the modal from any authed page.
- Sequence-id race protection observable via testing-library (mock latency for two requests, assert only the latest renders).
- All test scenarios pass.

---

- U10. **Result row components per entity type**

**Goal:** Render distinct result rows for each entity type with breadcrumbs, badges, and click-to-navigate.

**Requirements:** R3.

**Dependencies:** U9.

**Files:**
- Create: `apps/app/src/search/search-result-row-plan.tsx`
- Create: `apps/app/src/search/search-result-row-fiche.tsx`
- Create: `apps/app/src/search/search-result-row-indicateur.tsx`
- Create: `apps/app/src/search/search-result-row-action.tsx`
- Create: `apps/app/src/search/search-result-row-document.tsx`
- Modify: `apps/app/src/search/search-result-list.tsx` — wire row dispatch by entity type, ↑/↓ navigation (no wrap), Enter to navigate.
- Test: `apps/app/src/search/__tests__/search-result-rows.test.tsx`

**Approach:**
- Each row component receives a typed `SearchHit` for its entity (discriminated by `type` field).
- Per-entity content (matches the simplified U2 doc shapes):
  - `Plan`: `nom` (highlighted from `_formatted.nom`), badge "Plan". Sub-axes (with `parent_id` set) may show a parent breadcrumb if the implementer can resolve parent names from a small client-side cache; otherwise just the badge.
  - `Fiche` (top-level Action): `titre`, snippet from `description`, badge "Action".
  - `Fiche` (Sous-action): `titre`, snippet from `description`, badge "Sous-action". Parent/plan breadcrumbs are not in the doc shape — if needed, the row fetches parent context lazily on hover or omits.
  - `Indicateur`: `identifiant_referentiel` + `titre`, snippet from `description`, badge "Indicateur" + "Personnalisé" tag when `collectivite_id !== null`.
  - `Action` (mesure): `nom`, snippet from `description` or `commentaire` (whichever matched), badge "Mesure" plus a sub-badge derived from the doc's `type` field (e.g. "Action", "Sous-action", "Tâche") so users see the referentiel hierarchy tier.
  - `Document`: `filename` (highlighted), badge "Document". No additional context fields in v1.
- Highlights: render `_formatted` strings via a single shared `<HighlightedText html={...} />` utility component. The utility runs DOMPurify on every input (allowlist: `mark` tag only, no attributes) before `dangerouslySetInnerHTML`. **DOMPurify is required, not optional** — source data (fiche titles, descriptions, etc.) is user-controlled and may contain crafted HTML. Add DOMPurify to `apps/app/package.json` if not already present.
- Click navigates to the entity detail page using the existing route conventions (the implementer reads each entity's existing detail route).

**Test scenarios:**
- Happy path: a fiche row with `parent_id: null` shows badge "Action".
- Happy path: a fiche row with `parent_id: 42` shows badge "Sous-action".
- Happy path: an indicateur row with `collectivite_id !== null` shows the "Personnalisé" tag; one with `collectivite_id === null` does not.
- Happy path: a document row shows just the highlighted filename and the "Document" badge.
- Happy path: an action (mesure) row with `type: 'sous-action'` shows the "Mesure · Sous-action" badge pair.
- Happy path: highlight markers in `_formatted` render as `<mark>` in the DOM.
- Happy path: ↑/↓ moves selection; Enter on selected row navigates.
- Edge case: ↑ at top stops (no wrap); ↓ at bottom stops.
- Edge case: clicking a result while keyboard focus is on a different row navigates to the clicked one.
- Edge case (XSS): `_formatted` strings containing `<script>alert(1)</script>`, `<img onerror=...>`, and other crafted payloads are stripped to plain text or `<mark>`-only by DOMPurify; no script execution, no other HTML elements rendered. Test against a known XSS-vector list.

**Verification:**
- All entity types render with their distinct context.
- All test scenarios pass.
- Manual: ⌘K, type a query that matches across types, verify each row type renders correctly and navigates.

---

- U11. **ADR 0017 — Meilisearch global search architecture**

**Goal:** Capture the architecture decision in `doc/adr/` per the Nygard pattern.

**Requirements:** R10 (rationale for separation from webhook pipeline).

**Dependencies:** None functionally; ideally drafted alongside U1.

**Files:**
- Create: `doc/adr/0017-meilisearch-global-search-architecture.md`

**Approach:**
- Title: "Recherche globale via Meilisearch — pipeline d'indexation interne"
- Status: Accepted (or Proposed if review still open)
- Context: needs of global search, why Postgres FTS was rejected, why Meilisearch was chosen, why we separate the indexing pipeline from the existing `WebhookService`.
- Decision: 5 indexes (plans / fiches / indicateurs / actions / documents), per-domain indexer services in `apps/backend`, BullMQ queues, NestJS proxy, Meilisearch self-hosted on Koyeb v1.10+.
- Consequences: positive (instant-search UX, separation of concerns, idiomatic NestJS), negative (new infra to monitor, indexing-write coupling on every write path), neutral (DB-outbox pattern from ADR 0006 deferred to a follow-up).

**Patterns to follow:**
- ADR template: [doc/adr/0001-record-architecture-decisions.md](../adr/0001-record-architecture-decisions.md).
- Recent ADRs for tone: [doc/adr/0006-plateforme-background-jobs.md](../adr/0006-plateforme-background-jobs.md).

**Test scenarios:**
- *Test expectation: none — this is a documentation unit, no behavioral change.*

**Verification:**
- ADR file created at `doc/adr/0017-...`.
- Cross-references to U1–U12 implementation units and to the requirements doc.

---

- U12. **DocumentIndexerService + write-path enqueues**

**Goal:** Index `bibliotheque_fichier` rows so the user can find files by filename via the global search.

**Requirements:** R1, R7, R8.

**Dependencies:** U1, U2.

**Files:**
- Create: `apps/backend/src/collectivites/documents/document-indexer/document-indexer.service.ts`
- Modify: `apps/backend/src/collectivites/documents/documents.module.ts` (or wherever `DocumentService` is registered) — `BullModule.registerQueue({ name: SEARCH_INDEXING_DOCUMENT_QUEUE_NAME })`, register `DocumentIndexerService` provider. Queue-name constant declared at the top of `document-indexer.service.ts`: `export const SEARCH_INDEXING_DOCUMENT_QUEUE_NAME = 'search-indexing-document';`.
- Modify: `apps/backend/src/collectivites/documents/document.service.ts` — enqueue an upsert when a `bibliotheque_fichier` row is created, an upsert on filename change, and a delete on row removal. Implementer to enumerate the exact create/update/delete code paths in this service.
- Test: `apps/backend/src/collectivites/documents/document-indexer/document-indexer.service.e2e-spec.ts`

**Approach:**
- Document loader reads `bibliotheque_fichier` to produce `DocumentDocSchema` (U2): `id`, `collectivite_id` (nullable), `filename`. No joins.
- Tenant filter at query time: `collectivite_id IS NULL OR collectivite_id = ${activeId}` — same nullable-collectivité pattern as indicateurs.
- `confidentiel: boolean` field on `bibliotheque_fichier` is *not* indexed in v1 — confidential files appear in search results regardless of access (they're already filtered to the user's collectivité, which is the existing access model). Revisit if product feedback indicates a need for an extra confidentiel filter.

**Patterns to follow:** Same as U3.

**Test scenarios:**
- Happy path: uploading a file enqueues an upsert; doc has the correct `collectivite_id` and `filename`.
- Happy path: searching for a substring of the filename returns the document with the matched portion highlighted.
- Edge case: deleting the file enqueues a delete; doc no longer in the index.
- Integration (cross-collectivité isolation): a file uploaded to collectivité A is not visible to a user of collectivité B.
- Integration (global files): a file with `collectivite_id IS NULL` is visible to every collectivité.

**Verification:**
- The `search-indexing-document` queue is registered and processed.
- All test scenarios pass.

---

## System-Wide Impact

- **Interaction graph:** Every entity write path (plans / fiches / indicateurs / referentiel actions) gains a post-commit `enqueue` call. The `update-fiche.service.ts` precedent (already calling `webhookService.sendWebhookNotification`) shows this is a known seam — the indexing enqueue lives next to it.
- **Error propagation:** Indexing failures must never propagate back to the user-facing write request. The enqueue happens after commit; a failed enqueue is logged but does not roll back the entity write. The admin backfill is the correctness backstop.
- **State lifecycle risks:** The "small gap" between DB commit and BullMQ enqueue is a documented risk (Risks). Soft-deleted entities are removed from the index (delete op) rather than filtered at query time — eliminates the risk of a query path forgetting the `deleted=false` filter.
- **API surface parity:** The read-side proxy is the only path browsers can use to query Meilisearch. Direct Supabase access in `apps/app` is *not* affected by this plan but is a known parallel surface that the team is migrating off.
- **Integration coverage:** Cross-collectivité isolation is an integration property, not a unit property. The plan requires e2e tests with two-collectivité fixtures (U4, U7). The shared-fiches scenario is the most likely place for a future regression.
- **Unchanged invariants:** This plan does *not* modify any existing list endpoint, the `WebhookService` pipeline, the `apps/app` direct-Supabase reads, or the shape of any entity tables. The new module is additive.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| **Indexing drift from missing `enqueue` calls on a new write path.** A future PR adds an entity-write path and forgets the indexing enqueue → search silently misses entries. | Integration tests in U3–U6 of the form "create entity X via service S, search for X, expect hit". When a future PR adds a new write path, the absence of such a test is a code-review signal. Admin backfill is the recovery mechanism. |
| **Indexing drift from process crash between DB commit and BullMQ enqueue.** Per ADR 0006, Redis is non-persistent on Koyeb; a queue restart can drop unstarted jobs. | v1 accepts the gap for routine entity edits. Admin `mode: 'upsert'` backfill is the recovery (safe to run during traffic). A persisted `search_index_outbox` table (per ADR 0006 spirit) is deferred as a follow-up. Runbook: weekly scheduled `mode: 'upsert'` backfill across all indexes; `mode: 'rebuild'` reserved for orphan cleanup and post-import. |
| **Cross-collectivité data leak via stale `visible_collectivite_ids` after a failed unshare enqueue.** A queue loss after an unshare leaves the fiche visible to the ex-recipient. | (a) The `visible_collectivite_ids` multi-valued field eliminates the "forgot to include shared" class of bugs at query time. (b) U4 implements an hourly sweep cron in `FicheIndexerService` that re-enqueues upserts for fiches whose sharing rows changed in the last hour, capping the worst-case leak window at ~1 h even when Redis loses jobs. (c) Manual admin backfill is the long-tail backstop. |
| **`accesRestreint` confidentiality flip.** A collectivité becomes confidential after its docs are indexed. | The proxy resolves `isPrivate(collectiviteId)` per request and gates the entire search at `READ_CONFIDENTIEL`. A user blocked at the gate cannot reach `multiSearch`, so no document from the confidential collectivité is returned regardless of what's indexed. The indexer does not denormalize `acces_restreint` because the request-level gate is sufficient given search is always scoped to one collectivité per request. |
| **Out-of-order BullMQ delivery (delete before upsert).** Two concurrent jobs for the same entity can execute in arbitrary order. | The "load canonical doc from DB at job time" rule eliminates this risk: messages carry no payload, so there's nothing to be stale. A delete then upsert: delete becomes a no-op (entity gone in DB), upsert may re-create the doc *if* the entity was re-created — which is correct. |
| **Meilisearch outage at boot blocks backend startup.** | `client.health()` in `onApplicationBootstrap` logs but does not throw. Index settings bootstrap is idempotent and runs lazily on first use if needed. |
| **Meilisearch version too old for `IS NULL` filter.** | Pin Koyeb to v1.10+ as a prerequisite. Operational PR before this plan ships. Plan documents the minimum version explicitly. |
| **Federated multi-search latency variance.** | Use multi-search (per-bucket), not federated. Latency budget is independent per bucket; client-side merge is trivial. |
| **Frontend race condition: out-of-order responses corrupt result list.** | `useSearchQuery` increments a sequence id per request, drops responses that don't match the latest. AbortController on the previous fetch where supported. |
| **Bull-Board exposing search queue UI to unauthenticated users.** | Bull-Board is already BasicAuth-protected per existing pattern; new queues inherit. |
| **Index-rebuild during live writes loses concurrent writes.** | `mode: 'rebuild'` is reserved for orphan cleanup and forced post-settings reindex — operators run it during low-traffic windows per the runbook. **`mode: 'upsert'` is the path for routine drift recovery** and never loses concurrent writes. The lock prevents concurrent rebuilds (409). Future improvement if needed: dual-write to old + new index during rebuild. |
| **Indicateur values (`indicateur_valeur`) are not indexed.** Users may want to find indicateurs by value content. | Out of scope per requirements. Future iteration. |
| **`actions` index size growth from per-collectivité documents.** With actions × activated collectivités, the index can reach millions of docs (e.g. 3000 actions × 1000 active collectivités × 5 referentiels = 15M docs upper bound). | Estimated tractable for Meilisearch on Koyeb provisioning, but operators should monitor index size and ingestion lag. Mitigation: vertical scaling on Koyeb if needed; revisit per-(action × collectivité) model if scale becomes prohibitive. |
| **Activation hook coverage gap.** When a collectivité first activates a referentiel (first `client_scores` row), the fanout-activation job must fire to populate per-action docs. Missing this hook leaves the collectivité with no searchable mesures despite being activated. | Identify the activation hook explicitly during U6; add an integration test "first client_scores row → fanout job runs → docs exist for all actions of that referentiel × collectivité". Admin `mode: 'rebuild'` is the recovery if the hook is missed. |

---

## Alternative Approaches Considered

- **Postgres FTS (`websearch_to_tsquery` + `ts_rank` + `ts_headline` + `pg_trgm`).** Rejected in the requirements doc; instant-search UX/DX is the dominant factor. Postgres FTS is technically capable but would require substantially more glue code to feel as snappy and to deliver typo tolerance + ranked snippets at the same quality. Documented in ADR 0017.
- **Reuse `WebhookService` pipeline.** Rejected during requirements: external-partner contracts and internal indexing are different contracts and should evolve independently. Documented in the requirements doc and ADR 0017.
- **One mixed Meilisearch index across all entity types.** Rejected: distinct field weights, distinct facet shapes, harder to rebuild one in isolation. Per-entity indexes match the chip taxonomy 1-to-1.
- **Federated multi-search instead of multi-search.** Rejected: federated re-ranks across indexes which doesn't fit chip-grouped UI. Multi-search returns per-bucket results which the merger composes naturally for the chip taxonomy.
- **Persisted search-index outbox table for transactional integrity (ADR 0006 spirit).** Deferred to a follow-up. v1 accepts the small gap and relies on admin backfill. Tradeoff: simpler v1 ship, accept periodic drift recovery via cron.

---

## Phased Delivery

### Phase 1 — Foundation
- U1, U2.

### Phase 2 — Indexers (per-domain, can ship in parallel)
- U3, U4, U5, U6. U4 is the most complex (sharing + parent cascade) and should be reviewed first to validate the per-domain indexer pattern; the others follow the same shape.

### Phase 3 — Read-side proxy
- U7. Once U7 lands, search is *callable* end-to-end (no UI yet).

### Phase 4 — Admin backfill
- U8. Required before declaring v1 done — without backfill there's no recovery path.

### Phase 5 — Frontend
- U9, U10. Modal + result rows. Once shipped, the feature is user-facing.

### Phase 6 — Documentation
- U11 (ADR 0017). Can ship before, during, or after; recommend during Phase 1 review.

A reasonable split into PRs: one PR per unit (small enough), with U3 / U4 / U5 / U6 reviewable in parallel after U1+U2 land. U4 needs special review attention for the sharing scenario.

---

## Documentation Plan

- **ADR 0017** (U11) — architecture decision record.
- **Operational runbook** (separate PR; out of scope of this plan but referenced):
  - Meilisearch start/stop on Koyeb.
  - Backup and restore procedure.
  - Index rebuild procedure (admin endpoint usage; expected duration; low-traffic windows).
  - Monthly scheduled backfill cron suggestion.
  - Bull-Board access for search queues.
- **Update the [requirements doc](2026-04-27-001-meilisearch-global-search-requirements.md) status** from "draft" to "implemented" when this plan ships.
- **README / setup docs**: add `MEILI_HOST` and `MEILI_MASTER_KEY` to required env vars for local dev (point to a Docker-compose entry).

---

## Operational / Rollout Notes

- **Pre-requisite:** Koyeb-side PR to pin Meilisearch >= v1.10 and ensure `MEILI_HOST` / `MEILI_MASTER_KEY` are set in the backend env.
- **Local dev:** add a Meilisearch service to the existing dev stack (Docker Compose). Document in the README updated alongside this plan.
- **Roll-out sequence:**
  1. Deploy backend with the new search module + indexers; queues run, no traffic yet.
  2. Run `search.admin.reindex*({ mode: 'upsert' })` for all four entities to populate the indexes.
  3. Deploy frontend with the modal hidden behind a feature flag (if the team uses one) or shipped directly.
  4. Verify ⌘K functions in production for an internal user before announcing.
- **Monitoring:** Bull-Board UI for queue health. Sentry capture inside processors on permanent errors (mirror webhook-consumer pattern from `apps/tools`). Sentry breadcrumb on every search request: include latency, result count, and a hashed query digest — **never** the raw query text. (RGPD: French public-sector users may search for personal names.)
- **Weekly drift recovery cron:** schedule a `mode: 'upsert'` admin backfill across all five indexes during a low-traffic window each week. This catches drift from any failed enqueues invisible to the hourly sharing sweep (e.g. plan / indicateur / referentiel / document changes whose enqueues were lost).
- **Rollback:** the entire feature is additive. To roll back: stop the indexer workers, hide the ⌘K modal in the frontend (or unmount). Existing entity writes continue unaffected (failed enqueues will pile up in BullMQ but don't break the write path).

---

## Sources & References

- **Origin document:** [doc/plans/2026-04-27-001-meilisearch-global-search-requirements.md](2026-04-27-001-meilisearch-global-search-requirements.md)
- **ADRs:** [doc/adr/0006-plateforme-background-jobs.md](../adr/0006-plateforme-background-jobs.md), [doc/adr/0001-record-architecture-decisions.md](../adr/0001-record-architecture-decisions.md)
- **Solutions / learnings:**
  - [doc/solutions/architecture-patterns/supabase-to-trpc-with-computed-enrichment-2026-04-27.md](../solutions/architecture-patterns/supabase-to-trpc-with-computed-enrichment-2026-04-27.md)
  - [doc/solutions/architecture-patterns/extract-history-repository-from-service.md](../solutions/architecture-patterns/extract-history-repository-from-service.md)
  - [doc/solutions/database-issues/select-for-update-race-condition-drizzle-orm.md](../solutions/database-issues/select-for-update-race-condition-drizzle-orm.md)
  - [doc/solutions/test-failures/parallel-e2e-test-isolation.md](../solutions/test-failures/parallel-e2e-test-isolation.md)
- **Repo references:** see Context & Research.
- **External docs:** Meilisearch JS SDK ([GitHub](https://github.com/meilisearch/meilisearch-js)), filter syntax ([docs](https://www.meilisearch.com/docs/capabilities/filtering_sorting_faceting/advanced/filter_expression_syntax)), multi-search ([docs](https://www.meilisearch.com/docs/learn/multi_search/multi_search_vs_federated_search)), `localizedAttributes` ([docs](https://www.meilisearch.com/docs/learn/indexing/multilingual-datasets)), error codes ([docs](https://www.meilisearch.com/docs/reference/errors/overview)).
