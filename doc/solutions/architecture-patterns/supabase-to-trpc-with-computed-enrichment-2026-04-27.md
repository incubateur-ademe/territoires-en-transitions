---
title: Migrating a read path from direct Supabase to backend tRPC with server-computed enrichment
date: 2026-04-27
category: architecture-patterns
module: referentiels/historique
problem_type: architecture_pattern
component: service_object
severity: high
applies_when:
  - "Migrating a frontend feature off direct Supabase reads onto a backend tRPC procedure"
  - "Replacing a frontend depth/string heuristic with a server-computed field via an existing domain helper"
  - "Centralizing access control and shaping of a list endpoint that was previously protected only by RLS"
  - "Mechanically rewriting hooks and tests as part of a query-layer migration"
  - "Auditing SQL string interpolation, LIKE wildcards, date-boundary inclusivity, and unchecked casts at a tRPC boundary"
related_components:
  - database
  - authentication
  - testing_framework
tags:
  - trpc
  - supabase-migration
  - referentiels
  - historique
  - cache-invalidation
  - privacy
  - sql-injection
  - zod-output
---

# Migrating a read path from direct Supabase to backend tRPC with server-computed enrichment

## Context

This codebase has been migrating feature read paths off direct Supabase client access (the `legacy/` folder convention) onto backend tRPC procedures backed by Drizzle. The Historique migration on branch `feat/historique-action-type` was the third or fourth in this arc; preceding commits on the arc include "Déplacement de hooks d'accès à la donnée depuis le folder legacy", "Suppression du folder legacy", and the earlier folder move from `apps/backend/src/collectivites/historique/` to `apps/backend/src/referentiels/historique/` (session history, 2026-04-22). The route surface moved from `trpc.collectivites.historique.*` to `trpc.referentiels.historique.*` at that point.

Each migration looks mechanically simple — swap a `supabase.from(...)` call for a tRPC query — but a multi-reviewer review of this Historique migration surfaced 18 fixable issues, most of them recurring traps that the previous migrations also had to solve (or quietly didn't). The watch-list below captures them so the next migration in the arc doesn't re-discover them. The plan that drove this work, including the Risks R2/R3 mitigation requirements and the e2e coverage list, is at [doc/plans/2026-04-20-001-refactor-historique-action-type-plan.md](../../plans/2026-04-20-001-refactor-historique-action-type-plan.md).

The friction the pattern resolves: legacy SQL views often encode behavior — anonymization of disabled/deleted users, permission filtering through `auth.uid()`, custom date semantics — that silently disappears when you switch to a Drizzle read on the underlying tables. None of this is type-checkable; it only surfaces in review or, worse, in production.

## Guidance

### Refactor shape

For a feature `<feature>` in domain `<domain>`:

**Backend procedure** at `apps/backend/src/<domain>/<feature>/list-<feature>/`:
- `list-<feature>.request.ts` — Zod input schema (re-export from `@tet/domain` if shared with the FE)
- `list-<feature>.service.ts` — Drizzle reads, computed enrichment, structured logging
- `list-<feature>.router.ts` — `authedProcedure.input(...).output(...).query(...)` with an explicit `PermissionService.isAllowed` gate

Reference: [apps/backend/src/referentiels/list-actions/list-actions.router.ts](../../../apps/backend/src/referentiels/list-actions/list-actions.router.ts).

**Domain schemas** under `packages/domain/src/<domain>/<feature>/`:
- `<feature>-item.schema.ts`
- `<feature>-type.enum.ts`
- `list-<feature>.request.ts`

Both backend and frontend import from `@tet/domain`. Do not redefine row shapes on the FE.

**Frontend hook** under `apps/app/src/<domain>/<feature>/use-list-<feature>.ts`:

```ts
const trpc = useTRPC();
return useQuery(
  trpc.<domain>.<feature>.list.queryOptions({ collectiviteId, /* filters */ })
);
```

Reference: [apps/app/src/indicateurs/indicateurs/use-list-indicateurs.ts](../../../apps/app/src/indicateurs/indicateurs/use-list-indicateurs.ts).

### Permission gate (explicit, on every procedure)

```ts
const isPrivate = await this.collectivites.isPrivate(collectiviteId);
await this.permissionService.isAllowed(
  user,
  isPrivate
    ? PermissionOperationEnum['REFERENTIELS.READ_CONFIDENTIEL']
    : PermissionOperationEnum['REFERENTIELS.READ'],
  ResourceType.COLLECTIVITE,
  collectiviteId,
);
```

Apply on `list` AND on every sibling procedure (e.g. `listUtilisateurs` for filter dropdowns). The branch's review caught a missing AuthZ test on the secondary procedure — same gap, less visible.

### Reuse anonymization at the SQL boundary

Legacy views typically delegate to `utilisateur.dcp_display` (or similar) so disabled/deleted accounts surface as "Compte désactivé" / "Compte supprimé". A Drizzle read of the underlying `dcp` table bypasses that anonymization. Reuse the project's existing `createdByNom` CASE expression from [apps/backend/src/users/models/dcp.table.ts:31-36](../../../apps/backend/src/users/models/dcp.table.ts#L31-L36) rather than rebuilding it.

```sql
case
  when dcp.id is null    then 'Utilisateur inconnu'
  when dcp.limited       then 'Compte désactivé'
  when dcp.deleted       then 'Compte supprimé'
  else concat(dcp.prenom, ' ', dcp.nom)
end
```

### Reuse hierarchy / lookup caches

For computed columns that need referentiel hierarchy, inject `GetReferentielDefinitionService.getHierarchiesByReferentielIds` rather than building a parallel local cache in the new service. Future cache-invalidation strategy then has one owner.

### Per-row safe wrapper for enrichment

Computed columns (e.g. `actionType`) should be derived inside the service with a try/catch per row that returns `null` + a structured warning log on failure — never let one bad row 500 the page.

```ts
function safeActionType(
  row: { actionId: string | null },
  hierarchies: Record<ReferentielId, ActionType[]>,
  logger: Logger,
): ActionType | null {
  if (!row.actionId) return null;
  try {
    const referentielId = getReferentielIdFromActionId(row.actionId);
    return getActionTypeFromActionId(row.actionId, hierarchies[referentielId]);
  } catch (err) {
    logger.warn({ err, actionId: row.actionId }, 'actionType enrichment failed');
    return null;
  }
}
```

### Endpoint contract — always `.output(...)`

```ts
.input(listFeatureRequestSchema)
.output(listFeatureResponseSchema)   // required, even when inference would work
.query(({ input, ctx }) => service.list(input, ctx.user))
```

Runtime validation catches schema/SQL drift at the procedure boundary instead of at the consumer.

### Tighten input filter formats

```ts
// Bad — malformed values become Postgres 500s
startDate: z.string().optional(),
actionId: z.string().optional(),

// Good — validation errors stay at the tRPC boundary (400)
startDate: z.iso.date().optional(),                    // Zod 4 idiom
actionId: z.string().regex(/^[a-z]+(_[\d.]+)?$/).optional(),
```

### Escape LIKE wildcards from user input

Action ids in this codebase contain `_` literally (e.g. `cae_1.2.3`). Postgres LIKE treats `_` as "any single char" — without escaping, `cae_1` matches `cae_2.3` AND `caeX1...`.

```ts
const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');
where(like(table.actionId, `${escapeLike(input.actionId)}%`));
```

### Use strict-less-than at date boundaries

Replace any legacy `<= '${endDate} 24:00'` (which inclusively matches next-day 00:00:00) with strict less-than:

```ts
import { lt, gte } from 'drizzle-orm';
and(
  gte(table.modifiedAt, startDate),
  lt(table.modifiedAt, `${endDate} 24:00`),  // 24:00 = next-day 00:00; lt excludes it
);
```

### Parse, don't cast

```ts
// Bad — defers errors to the consumer
return { ...row, type: row.type as HistoriqueType };

// Good — fail at the boundary
return { ...row, type: historiqueTypeSchema.parse(row.type) };
// Or, with a safe wrapper, historiqueTypeSchema.safeParse(...)
```

### Audit cache invalidations BEFORE deleting the legacy hook

Mutation hooks elsewhere often invalidate the *old* Supabase queryKey shape, e.g. `['historique', collectiviteId]`. After migration these become silent no-ops. Convention is `trpc.<path>.<method>.queryKey()` — see [apps/app/src/plans/sous-actions/data/use-update-sous-action.ts:62](../../../apps/app/src/plans/sous-actions/data/use-update-sous-action.ts#L62) and [apps/app/src/app/pages/collectivite/Indicateurs/data/use-delete-indicateur-valeur.ts:15-26](../../../apps/app/src/app/pages/collectivite/Indicateurs/data/use-delete-indicateur-valeur.ts#L15-L26). (Note: the plan's prose used `pathFilter()`; the code-base actually uses `.queryKey()` — verify the convention before applying.)

```bash
rg "queryKey.*<feature>"           apps/app
rg "invalidateQueries.*<feature>"  apps/app
```

For each hit, replace with:

```ts
const trpc = useTRPC();
queryClient.invalidateQueries({
  queryKey: trpc.<domain>.<feature>.list.queryKey(),
});
queryClient.invalidateQueries({
  queryKey: trpc.<domain>.<feature>.listUtilisateurs.queryKey(),
});
```

Calling `.queryKey()` with no args matches every cached query under that procedure regardless of input — same scope as the old `['<feature>', collectiviteId]` intent.

### Be careful with shared test fixture cleanup

Adding cleanup to a shared helper (e.g. `cleanupReferentielActionStatutsAndLabellisations`) propagates to every spec using it. Scope additions per-collectivité; never delete referentiel-level data. For test-isolation rules generally, defer to [doc/solutions/test-failures/parallel-e2e-test-isolation.md](../test-failures/parallel-e2e-test-isolation.md).

### Preserve existing comments during mechanical rewrites *(auto memory [claude])*

When mechanically rewriting hooks and their tests, do not strip existing comments. Prior refactors have erased commit-archeology comments that captured non-obvious context.

## Why This Matters

- **Silent regressions are the worst kind.** Anonymization disappearing, an `_` wildcard suddenly matching everything, or a stale `invalidateQueries` no-op all type-check, build, and look fine in cursory review. They surface as data leaks, wrong filter results, or stale UI — never as a stack trace.
- **`auth.uid()` doesn't exist server-side.** Permission filtering that the legacy view did implicitly via RLS must become an explicit `PermissionService.isAllowed` call. Skip it on a sibling procedure (e.g. `listUtilisateurs`) and the AuthZ surface widens silently.
- **The procedure boundary is the only place runtime validation is cheap.** Once a row crosses into the FE without `.output()` parsing, the next time the SQL drifts you debug from `undefined is not a function` four components deep.
- **Cache-invalidation drift compounds.** Each migration that doesn't audit invalidations adds another stale queryKey shape; six migrations in, every mutation in the app silently fails to refresh half the screens.
- **Reviewer load drops with a checklist.** Of the 18 fixes this branch's review caught, most are pattern-matchable. Encoding them lets the next PR ship with fewer review cycles.

## When to Apply

This guidance applies when **any** of these hold:

- A frontend hook reads from `supabase.from(...)` or sits in a `legacy/` folder, and you're migrating it to tRPC.
- A SQL view (`*_display`, `*_listing`, etc.) is being replaced by Drizzle reads on the underlying tables.
- You're adding a new tRPC `list-*` procedure for a domain that already has Supabase-era read paths in the same codebase.
- You're touching cache invalidation in mutation hooks that target an entity whose read path was recently migrated.

Signals to escalate the audit:

- The legacy view name contains `display`, `dcp`, `_anonyme`, or similar — anonymization is likely encoded inside.
- Filter inputs include free-form strings, dates, or ids with structural punctuation (`_`, `.`).
- The view used `auth.uid()` directly, or was joined against a `*_droits` / `*_permissions` table.
- The feature has filter dropdowns or related list endpoints (don't forget AuthZ on the siblings).

## Examples

### Anonymization — before / after

Before (legacy view, implicit anonymization through `dcp_display`):

```sql
-- utilisateur.modified_by_nom() selected from utilisateur.dcp_display:
--   case when limited then 'compte désactivé'
--        when deleted then 'compte supprimé'
--        else dcp.nom end
```

After (Drizzle, explicit reuse):

```ts
import { dcpTable, createdByNom } from '@/backend/users/models/dcp.table';

const rows = await db
  .select({
    /* ... */
    modifiedByNom: createdByNom,        // CASE imported, not rebuilt
  })
  .from(historiqueTable)
  .leftJoin(dcpTable, eq(historiqueTable.modifiedBy, dcpTable.userId));
```

### LIKE escape — before / after

Before:

```ts
where(like(historique.actionId, `${input.actionId}%`));
// input "cae_1" matches "cae_1.2.3" AND "cae_2.3" AND "caeX1..."
```

After:

```ts
const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');
where(like(historique.actionId, `${escapeLike(input.actionId)}%`));
// input "cae_1" matches only ids starting with the literal "cae_1"
```

### Date boundary — before / after

Before:

```ts
lte(historique.modifiedAt, sql`${input.endDate} 24:00`);
// "2026-04-27 24:00" parses as 2026-04-28 00:00:00 — includes next-day rows
```

After:

```ts
lt(historique.modifiedAt, sql`${input.endDate} 24:00`);
// strict less-than excludes 2026-04-28 00:00:00, includes 2026-04-27 23:59:59
```

E2e regression guard:

```ts
it("endDate is inclusive of the day, exclusive of the next", async () => {
  await seed({ at: '2026-04-27 23:59:59+00' });   // included
  await seed({ at: '2026-04-28 00:00:00+00' });   // excluded
  const r = await caller.historique.list({ endDate: '2026-04-27' });
  expect(r.items).toHaveLength(1);
});
```

### Output contract — before / after

Before:

```ts
.input(listHistoriqueRequestSchema)
.query(({ input, ctx }) => service.list(input, ctx.user));
// SQL drift surfaces as a runtime error in a React component
```

After:

```ts
.input(listHistoriqueRequestSchema)
.output(listHistoriqueResponseSchema)   // catches drift at the boundary
.query(({ input, ctx }) => service.list(input, ctx.user));
```

### Cache invalidation audit — before / after

Before, in a mutation hook:

```ts
qc.invalidateQueries({ queryKey: ['historique', collectiviteId] });
// no-op after migration — silent stale UI
```

After:

```ts
const trpc = useTRPC();
qc.invalidateQueries({
  queryKey: trpc.referentiels.historique.list.queryKey(),
});
qc.invalidateQueries({
  queryKey: trpc.referentiels.historique.listUtilisateurs.queryKey(),
});
```

Audit BEFORE deleting the legacy hook:

```bash
rg "queryKey.*historique"           apps/app
rg "invalidateQueries.*historique"  apps/app
```

### Recommended e2e coverage (template per migration)

- Auth: unauthenticated → rejected.
- AuthZ: non-member → rejected on `list` **and** every sibling (e.g. `listUtilisateurs`). Set the test collectivité to `accesRestreint: true` to exercise the `read_confidentiel` branch.
- Isolation: collectivité A reader sees only A's rows.
- Each filter independently.
- Each filter combination the UI exposes.
- Pagination + `total`: page-beyond-total returns `[]`; `total` constant across pages.
- Computed enrichment: each hierarchy level returns the right type; rows without the source field return `null`.
- Error resilience: a row that would throw inside per-row enrichment is caught (returns `null`, no 500). Seed via raw SQL with FK chain in correct order: parent table → child table → historique row.
- Date boundary: `endDate 23:59:59` included, `endDate+1 00:00:00` excluded.
- Anonymization: a `limited` user and a `deleted` user surface as "Compte désactivé" / "Compte supprimé", not their real name.
- Sibling procedure dedup (e.g. `listUtilisateurs` returns one entry per user even when they contributed to multiple sources).

### Cited references in this repo

- [apps/backend/src/referentiels/list-actions/list-actions.router.ts](../../../apps/backend/src/referentiels/list-actions/list-actions.router.ts) — canonical `authedProcedure` + `PermissionService.isAllowed` shape.
- [apps/backend/src/users/models/dcp.table.ts:31-36](../../../apps/backend/src/users/models/dcp.table.ts#L31-L36) — reusable `createdByNom` anonymization CASE.
- [apps/app/src/indicateurs/indicateurs/use-list-indicateurs.ts](../../../apps/app/src/indicateurs/indicateurs/use-list-indicateurs.ts) — canonical FE hook shape.
- [apps/app/src/plans/sous-actions/data/use-update-sous-action.ts:62](../../../apps/app/src/plans/sous-actions/data/use-update-sous-action.ts#L62) and [apps/app/src/app/pages/collectivite/Indicateurs/data/use-delete-indicateur-valeur.ts:15-26](../../../apps/app/src/app/pages/collectivite/Indicateurs/data/use-delete-indicateur-valeur.ts#L15-L26) — `trpc.<path>.<method>.queryKey()` invalidation convention.
- [apps/backend/src/referentiels/historique/list-historique/list-historique.service.ts](../../../apps/backend/src/referentiels/historique/list-historique/list-historique.service.ts) and [list-historique.router.e2e-spec.ts](../../../apps/backend/src/referentiels/historique/list-historique/list-historique.router.e2e-spec.ts) — concrete reference implementation that ships with the test scenarios above.
- [doc/plans/2026-04-20-001-refactor-historique-action-type-plan.md](../../plans/2026-04-20-001-refactor-historique-action-type-plan.md) — original plan with rationale for risks R1-R5.

## Related

- [doc/solutions/architecture-patterns/extract-history-repository-from-service.md](./extract-history-repository-from-service.md) — write-side companion: extracting historique persistence into dedicated `@Injectable()` repositories. Apply this pattern on the read side; that one on the write side.
- [doc/solutions/database-issues/select-for-update-race-condition-drizzle-orm.md](../database-issues/select-for-update-race-condition-drizzle-orm.md) — race condition in historique writes. Orthogonal but useful context if the new read repository touches `FOR UPDATE` consumers.
- [doc/solutions/test-failures/parallel-e2e-test-isolation.md](../test-failures/parallel-e2e-test-isolation.md) — canonical e2e test isolation rules. Defer to it for fixture/cleanup discipline rather than restating here.
