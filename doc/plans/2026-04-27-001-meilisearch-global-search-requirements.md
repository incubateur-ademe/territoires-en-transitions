---
title: Global ⌘K search across plans, fiches, indicateurs, and mesures (Meilisearch)
type: requirements
status: draft
date: 2026-04-27
---

# Global ⌘K search across plans, fiches, indicateurs, and mesures (Meilisearch)

## Overview

Add a Notion-style global search to the app: a ⌘K / Ctrl+K modal available everywhere, that performs full-text search across the user's plans, fiches actions, indicateurs, and the global referentiel mesures (including sous-actions as their own facet), with type filters, ranked snippets with the matched term highlighted, and click-through to the entity's detail page. The search engine is **Meilisearch** (already self-hosted alongside the rest of the stack on Koyeb), fronted by a NestJS proxy endpoint, kept in sync near-realtime by **per-domain indexer services** (`FicheIndexerService`, `PlanIndexerService`, etc.) that consume their own BullMQ queues and write through a shared `SearchIndexerService` wrapper around the Meilisearch SDK.

This document captures **what** to build. Detailed implementation (Meilisearch deployment topology, index schemas, exact tRPC contract, sync job code) is deferred to `/ce-plan`.

## Problem Frame

Today, every entity list (`list-fiches`, `list-indicateurs`, `list-personnalisation-questions`, `get-referentiel`) implements its own page-scoped search using Postgres `ilike`. This:

- Forces users to know **where** to look before they can search — no way to find a fiche by name from the indicateurs page, no way to find a mesure from anywhere outside the referentiel tree.
- Returns substring matches with no ranking, no typo tolerance, no field weighting (a match in the title is not surfaced over a match in a long description).
- Has no result snippets, so users can't tell *why* a row matched without clicking through.

Notion-style global search is a known, learned UX pattern that solves this directly: one input, one shortcut, results from across the product, ranked, with snippets.

Postgres FTS (`websearch_to_tsquery` + `ts_rank` + `ts_headline` + `pg_trgm`) could match most of this functionally, but would need significant glue code to feel as snappy as Meilisearch's instant-search experience. The chosen tradeoff: accept the operational cost of a second datastore in exchange for substantially better DX building the instant-search UI and stronger out-of-the-box typo tolerance and ranking.

## Users and Primary Use Cases

The primary users are **chargés de mission** in collectivités (and accompanying conseillers when they're scoped to a collectivité). Concrete moments this search must serve well:

1. **Find a known fiche by partial title.** "I edited a fiche about *bornes de recharge* last week and want to open it now." Today: navigate to the plan, open the right axe, scroll. Tomorrow: ⌘K → type "bornes" → top result.
2. **Find an indicateur by topic.** "I want to record a value on the *consommation gaz bâtiments* indicateur." Today: navigate to indicateurs page, paginate / filter. Tomorrow: ⌘K → type "gaz" → see indicateur in results.
3. **Discover relevant referentiel mesures.** "We're starting work on mobility — what does the CAE referentiel say about *mobilité douce*?" Today: open referentiel tree, drill manually. Tomorrow: ⌘K → "mobilité" → see ranked CAE/ECI mesures, even from referentiels not yet started.
4. **Cross-entity discovery.** "Type *climat* — I expect to see our climat plan, related fiches, the climat-related indicateurs we already track, and CAE mesures, in one ranked list." Filterable by type to narrow down.

Keyboard-first navigation is part of the user expectation: ⌘K to open, ↑/↓ to move, Enter to open, Esc to close.

## Goals

- A user types a query in a global modal and within a few hundred ms sees ranked results with the matched term highlighted in context.
- Results carry a clear type badge (Plan / Action / Sous-action / Indicateur / Mesure) so the user can tell what each row is at a glance.
- A user can filter the result set to one or more entity types via clickable chips, with a "mode exclusif" toggle (clicking one chip disables the others, mirroring the screenshot reference).
- Clicking a result navigates to the canonical detail page for that entity.
- An entity created or edited by a user appears in (or disappears from) search within seconds, not minutes.
- Search results never leak data across collectivités: a chargé de mission of collectivité A never sees collectivité B's fiches, plans, or indicateurs.

## Non-Goals (out of scope for v1)

- **Search history / recents.** No "recent searches" list, no suggested queries, no per-user query persistence. Can be a follow-up.
- **Saved searches / advanced query syntax.** No `field:value` operator language, no AND/OR/NOT explicit operators (Meilisearch's default behavior is fine).
- **Cross-collectivité search for accompanying users.** Even if a user has access to multiple collectivités, v1 searches the *currently active* collectivité only. Switching collectivité re-scopes the search.
- **Search inside attached files / preuves / PDFs.** Index text fields only. OCR and document body indexing are out of scope.
- **Faceted filtering beyond entity type.** Filtering by pilote, statut, axe, thématique, etc. is deferred — only the type chip + exclusive mode is in v1.
- **Search analytics / telemetry dashboards.** Out of scope; basic logging is enough for v1.
- **Replacing the existing per-page list search.** The current `ilike`-based filters on the fiches list, indicateurs list, etc. stay as-is. Global search is additive, not a migration.

## UX Specification (modal)

**Trigger.** ⌘K on macOS, Ctrl+K on Windows/Linux. Available from every authenticated page in the app. The modal is dismissible via Esc, click outside, or selecting a result.

**Layout.**

- A single text input, autofocused on open.
- Below the input, a row of entity-type chips (`Plans`, `Actions`, `Sous-actions`, `Indicateurs`, `Mesures`) with an eye / toggle affordance, matching the screenshot. Default: all five enabled. A "Mode exclusif" toggle is exposed; when on, clicking one chip disables the others.
- Below the chips, the result list. Each row shows: the entity title with the matched term(s) highlighted, a one-line snippet of the surrounding context (from a description / content field) with the matched term highlighted, and a type badge on the right.
- A keyboard hint footer: `↓ ↑ pour naviguer · ↵ pour ouvrir · ESC pour fermer`.
- Empty state: short message ("Tapez pour rechercher dans vos plans, actions, sous-actions, indicateurs et mesures") when no query is present; "Aucun résultat" when query returns nothing.

**Behavior.**

- Debounced query: ~150 ms after the last keystroke, send to backend.
- Default page size: 10–20 top results across all enabled types, ranked by relevance.
- Selecting a result via Enter or click navigates to that entity's detail page in the current tab and closes the modal.
- The modal is fully keyboard-navigable; mouse use is supported but not required.

**Visual reference.** The screenshot shared during brainstorm (search input + chips + result row with `SOUS-ACTION` type badge + keyboard footer) is the visual spec. Five chips: `Plans / Actions / Sous-actions / Indicateurs / Mesures`. Note: the five chips map to **four** underlying entity types in code — see the Indexed Entities section.

## Indexed Entities (data scope)

The five UI chips map to **four** underlying entity types, because the UI labels "Action" and "Sous-action" both refer to *fiches* — a fiche is shown as "Action" when it has no parent fiche and "Sous-action" when it does. There is also a vocabulary clash worth flagging up front:

- **"Action" (code)** = a referentiel `action_definition` row → labeled **"Mesure"** in the UI.
- **"Action" (UI)** = a *fiche action* with no parent → in code, a `fiche` row with `parent_fiche_id IS NULL`.
- **"Sous-action" (UI)** = a *fiche action* that has a parent → in code, a `fiche` row with `parent_fiche_id IS NOT NULL`.

Mapping between UI chip, code domain, and Meilisearch index:

| UI chip      | Code domain                                                       | Source                              | Index           | Scope                                                                                |
| ------------ | ----------------------------------------------------------------- | ----------------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| Plans        | Plans (per-collectivité)                                          | `apps/backend/src/plans/plans/`     | `plans`         | Filtered to the user's active collectivité.                                          |
| Actions      | Fiches actions **without** a parent fiche                         | `apps/backend/src/plans/fiches/`    | `fiches`        | Filtered to active collectivité; chip filter `parent_fiche_id IS NULL`.              |
| Sous-actions | Fiches actions **with** a parent fiche                            | `apps/backend/src/plans/fiches/`    | `fiches`        | Filtered to active collectivité; chip filter `parent_fiche_id IS NOT NULL`.          |
| Indicateurs  | Indicateurs (predefined + collectivité-created)                   | `apps/backend/src/indicateurs/`     | `indicateurs`   | Predefined indicateurs: global. Custom indicateurs: filtered to active collectivité. |
| Mesures      | Referentiel actions (`action_definition` rows, code-named "action") | `apps/backend/src/referentiels/`    | `actions`       | Global — all referentiels searchable, including those the collectivité hasn't started. |

Implications for the indexing layer:

- **Four** indexes, **four** indexer services, **four** queues — not five. The `fiches` index stores `parent_fiche_id` (the actual parent identifier when present, otherwise null) as a filterable attribute. The read-side proxy applies `parent_fiche_id IS NULL` / `IS NOT NULL` to support the Actions vs Sous-actions chip split, and the field is also available for future features like "find all sous-actions of fiche X".
- The result row continues to render a clear type badge (`Action` vs `Sous-action` vs `Mesure` etc.) based on the document fields, so users see the same five-chip taxonomy in the UI even though it's backed by four indexes.

**Searchable fields per entity** (planning will finalize exact column list and weights):

- Plan: title, description.
- Fiche: title, description, free-text fields (objectifs, résultats attendus), tags / thématiques. Same searchable fields whether the fiche is a top-level Action or a Sous-action.
- Indicateur: identifiant, title, description, unit, thématique tags.
- Action (referentiel — UI "Mesure"): identifiant (e.g. `cae_1.1`), title, description, exigences / contenu fields.

**Authorization invariants.** The NestJS proxy attaches the active `collectivite_id` to every search request. Per-collectivité documents are filtered server-side using a `collectivite_id IN [active_id]` predicate baked into the Meilisearch query. Global documents (mesures) are returned to all authenticated users. Meilisearch is never reachable directly from the browser; all calls go through the backend.

**Soft-deleted / draft entities.** v1 indexes only entities that the user can already access through normal UI lists. Soft-deleted rows are excluded from the index. If draft / private fiches exist, they remain visible in search to users who can already see them — same visibility rules as the current list endpoints.

## Architecture Decisions

These are the load-bearing decisions resolved during brainstorm. Implementation details (config, file layout, exact contracts) are deferred to `/ce-plan`.

1. **Engine: Meilisearch, self-hosted on Koyeb.** Already deployed alongside the rest of the stack. Chosen over Postgres FTS for instant-search UX/DX: Postgres FTS is technically capable but would need substantially more glue code to feel as snappy and to deliver typo tolerance + ranked snippets at the same quality.
2. **Topology: NestJS proxy.** All client search calls hit a NestJS tRPC endpoint (likely under `apps/backend/src/search/` or similar). NestJS owns the Meilisearch client, attaches the active `collectivite_id` scope filter, forwards to Meilisearch, and returns shaped results. Meilisearch is **not** exposed to the browser, removes the need for tenant tokens, simplifies key rotation, and lets us reuse the existing tRPC + collectivité-context middleware and rate limiting.
3. **Sync: per-domain indexer services on per-entity-type BullMQ queues, sharing a thin Meilisearch SDK wrapper.** The indexing layer is split into two responsibilities:

   - **`SearchIndexerService`** (in `apps/backend/src/search/`): a thin wrapper around the Meilisearch SDK. Owns connection, auth, telemetry, error handling, and the generic operations the domain indexers need: `upsert(indexName, doc)`, `delete(indexName, id)`, `multiSearch(...)`. **No domain knowledge.**
   - **Four indexer services**, one per sub-domain, co-located with the domain module:
     - `PlanIndexerService` in `apps/backend/src/plans/plans/` → index `plans`, queue `search-indexing-plan`.
     - `FicheIndexerService` in `apps/backend/src/plans/fiches/` → index `fiches`, queue `search-indexing-fiche`. Indexes both top-level fiches (UI "Action") and sub-fiches (UI "Sous-action") in the same index, storing `parent_fiche_id` on each document so the read-side proxy can split them at query time.
     - `IndicateurIndexerService` in `apps/backend/src/indicateurs/` → index `indicateurs`, queue `search-indexing-indicateur`.
     - `ActionIndexerService` in `apps/backend/src/referentiels/` → index `actions`, queue `search-indexing-action`. Code-named "Action" (matching `action_definition`); surfaced in the UI as "Mesure".

   Each domain indexer:
   - Owns the `@Processor` for its dedicated queue.
   - Owns the entity-to-document transform — it knows which fields to index, which related rows to join, and what document shape to produce.
   - Delegates the actual write to `SearchIndexerService` for the SDK call.

   On entity create/update/delete, the domain's existing write-path service (e.g. `update-fiche.service.ts`) enqueues a small message (e.g. `{ op: 'upsert' | 'delete', entityId }`) onto its own queue. The domain's `@Processor` consumes the message, loads the canonical document via its own transform, and calls `SearchIndexerService.upsert(...)` or `.delete(...)`. Retries / exponential backoff via BullMQ. Acceptable freshness: a few seconds.

   Reasons for this structure:
   - **Domain ownership.** Each sub-domain knows best how to produce its own search document — which joins, which fields, which related rows. Keeping the indexer next to the entity service means schema changes for that entity are obvious in one place.
   - **Single SDK wrapper.** Connection setup, auth, error mapping, telemetry, and `multiSearch` fanout live in one place. No domain repeats Meilisearch SDK boilerplate.
   - **Clear separation of concerns.** The queue/processor pattern (BullMQ), the SDK call (`SearchIndexerService`), and the entity-specific document shape (per-domain indexer) are three distinct responsibilities, each in its right home.

   **Rationale — keep internal indexing separate from the existing external webhook pipeline.** The repo already has a `WebhookService` (`apps/backend/src/utils/webhooks/`) that persists `webhook_message` rows and delivers entity changes to external HTTP subscribers (e.g. *communs*) through a BullMQ queue consumed by `apps/tools`. Reusing that pipeline for Meilisearch indexing was considered and rejected: it would conflate two concerns with very different contracts.

   - **External webhook delivery** is a contract with third parties: payload shape is part of an integration agreement, auth and retry policies are tuned for partner-facing reliability, the `webhook_message` audit trail exists to debug deliveries to outside systems, and failure visibility is shared with the integration owner.
   - **Internal search indexing** is a private implementation detail of our own product: we control both ends, the document shape can change freely alongside our schemas, there is no external auth, and failures are operationally ours alone to handle.

   Keeping the two pipelines separate means: external partners can't be impacted by changes we make to the search document shape; search-side schema changes can't accidentally fire ill-formed payloads to partners; retry policies, monitoring, and on-call ownership can be tuned per pipeline. The queue layer is still essential for indexing — Meilisearch outages or slow indexing must not block the user-facing write path, and BullMQ gives us non-blocking writes plus retry-with-backoff for free.

4. **One Meilisearch index per entity type.** Four indexes (`plans`, `fiches`, `indicateurs`, `actions`) — *not* five, since fiches host both UI "Actions" and "Sous-actions" in the same index, distinguished by `parent_fiche_id` (null vs non-null). Reasons for the per-entity split: distinct field weights, distinct facet/filter shapes, easier to rebuild one in isolation. The read-side proxy fans out a single user query into the enabled indexes in parallel and merges the result list — Meilisearch supports this via `multiSearch`, exposed through `SearchIndexerService`. The 1:1 mapping between indexes, queues, and per-domain indexer services keeps mental load low: each entity has its own write path, its own queue, its own indexer, and its own index. The five UI chips collapse onto these four indexes by applying a `parent_fiche_id IS NULL` / `IS NOT NULL` filter on the `fiches` index for the Actions vs Sous-actions split.
5. **Initial backfill: admin tRPC endpoint that delegates to each domain's indexer.** An authenticated admin-only tRPC endpoint exposes one operation per entity type (e.g. `search.admin.reindexFiches`, `search.admin.reindexActions`, etc. — four operations). Each operation calls the corresponding domain indexer's `indexAll()` method (or enqueues batches into its queue), so live and backfill share the same entity-to-document transform — there's exactly one place per domain where indexing logic lives. Re-runnable at any time as the disaster-recovery / re-index path; same endpoint is the way to recover from a schema change that forces a reindex.

## Success Criteria

- A user can press ⌘K from any page, type a 3+ character query, and see ranked results across plans, fiches (Actions and Sous-actions), indicateurs, and referentiel actions (UI "Mesures") within ~200 ms server-side (excluding network).
- A user finds a fiche they created or edited within the last 5 seconds — i.e. write-to-search lag is consistently under ~5 s.
- Type chips visibly filter the result list. Exclusive mode behaves per the screenshot reference.
- Matched terms in titles and snippets are highlighted in result rows.
- Cross-collectivité leak is prevented by integration tests: a user authenticated as collectivité A receives zero results from collectivité B's fiches, plans, or custom indicateurs for any plausible query.
- Selecting a result navigates to the correct detail page in the current tab.
- Backfilling a fresh Meilisearch instance from production data completes in a reasonable batch window (target: < 30 min for a typical collectivité dataset; full backfill across all collectivités acceptable to run during low-traffic periods).

## Open Questions

These remain to be decided during or after planning:

1. **French stemming / synonyms.** Meilisearch supports French tokenization out of the box; do we want to ship a curated synonyms list (e.g. *énergie* / *énergétique*, *vélo* / *cyclable*)? Default: ship without a synonyms list, add if real usage shows misses.
2. **Coverage of `enqueue` calls across entity write paths.** Mapping every create/update/delete path for plans, fiches, indicateurs, sous-actions, and mesures (and referentiel imports) to a queue-publish call is non-trivial work and should be enumerated during planning. Mitigations to consider: a domain-event abstraction so write paths emit a single event that the indexing module subscribes to; integration tests of the form "create X → assert X appears in search index"; lint / convention to keep the call colocated with the entity service.
3. **Transactional integrity between DB write and queue enqueue.** If the DB transaction commits and the process crashes before the BullMQ job is enqueued, the index drifts silently. Options: enqueue inside the transaction (depends on outbox-style integration with Drizzle), accept the gap and let the periodic backfill correct it, or build a transactional outbox. Default: accept the small gap and rely on the admin backfill endpoint as the correctness backstop; revisit if drift is observed in practice.

**Decisions resolved during brainstorm** (not open):

- Five entity-type chips (Plans / Actions / Sous-actions / Indicateurs / Mesures).
- Meilisearch self-hosted alongside the rest of the stack (Koyeb).
- Sync via per-domain indexer services (`FicheIndexerService`, `PlanIndexerService`, etc.) co-located with their entity modules, consuming per-entity-type BullMQ queues, sharing a thin `SearchIndexerService` wrapper around the Meilisearch SDK. *Not* through the existing `WebhookService` — internal indexing is kept separate from external webhook delivery so the two pipelines can evolve independently.
- Initial backfill via admin tRPC endpoint that delegates to each domain's indexer (live and backfill share the same entity-to-document transform, one path per domain).
- Always an active collectivité — no need for a "no-collectivité" search mode.
- Search request log retention is governed by Koyeb's existing log-retention policy for the rest of the services, not a separate concern.

## Risks

- **Sync drift between DB and Meilisearch.** A failed BullMQ delivery, a missing enqueue on a new write path, or a process crash between DB commit and enqueue means the index disagrees with the DB. Mitigation: the admin backfill endpoint doubles as a periodic re-sync (cron / on-demand); add monitoring on `search-indexing-*` queue failure rates; treat indexing operations as idempotent so retries are safe.
- **Coverage gaps in indexing enqueues.** Forgetting to enqueue on a new write path silently drops the entity from search. Mitigation: at planning time, enumerate every entity write path; consider a lint rule, integration tests that assert "after creating X, X is searchable", and/or moving the enqueue call into a domain-event abstraction that's harder to forget.
- **Authorization regressions.** Forgetting to attach the collectivité filter on a new entity type or a new query path leaks data across tenants. Mitigation: centralize the filter injection in a single proxy layer; add an integration test that exercises the proxy against a two-collectivité fixture and asserts zero leakage.
- **Operational cost of a separate datastore.** Meilisearch is already self-hosted, but new index schemas, version upgrades, and backups still need a runbook. Mitigation: document start/stop, backup/restore, and reindex procedures at planning time.
- **Index schema drift.** Field changes on entities (e.g. renaming a column on `fiche_action`) can silently break the indexed document shape. Mitigation: keep each domain's entity-to-document transform inside that domain's indexer service (e.g. `FicheIndexerService`), so schema changes and indexing logic are reviewed together; the admin backfill endpoint catches drift on its next run.

## Next Steps

When this doc is approved, hand off to `/ce-plan` to design the implementation:

- NestJS module structure: `apps/backend/src/search/` hosts `SearchIndexerService` (SDK wrapper) and the read-side proxy router/service. Four domain indexer services co-located with their entity modules: `PlanIndexerService` (plans/plans), `FicheIndexerService` (plans/fiches — handles both UI "Actions" and "Sous-actions"), `IndicateurIndexerService` (indicateurs), `ActionIndexerService` (referentiels — UI "Mesures"). Each owns a `@Processor` for its queue.
- Index schemas (4 indexes), filterable / searchable / sortable attribute lists, ranking rule overrides per entity, encapsulated in the corresponding domain indexer. The `fiches` index stores `parent_fiche_id` (filterable) to support the Actions vs Sous-actions chip split at query time and to enable future parent-aware queries.
- Per-entity-type queue design (`search-indexing-plan`, `search-indexing-fiche`, `search-indexing-indicateur`, `search-indexing-action`), retry policy, idempotency guarantees.
- Enumeration of the entity write paths that need to enqueue indexing messages, plus the strategy to keep new paths from drifting (domain-event abstraction vs explicit calls + tests).
- Admin tRPC backfill endpoint that delegates to each domain indexer's `indexAll()` (or batched-enqueue) method, batched and re-runnable.
- Frontend ⌘K modal component, keyboard handling, type-chip state, exclusive-mode toggle, result row component, navigation routing.
- Test plan: unit tests for filter injection, integration tests for cross-collectivité isolation and "create-X-then-search-X" coverage, e2e test for the modal happy path.
- Operational runbook (Meilisearch start/stop, backup/restore, reindex procedure on Koyeb).
