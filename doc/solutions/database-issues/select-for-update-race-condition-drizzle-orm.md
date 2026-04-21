---
title: "Race condition in history tracking for action commentaires and statuts"
category: database-issues
date: 2026-04-14
tags:
  - race-condition
  - postgresql
  - drizzle-orm
  - nestjs
  - select-for-update
  - history-tracking
severity: medium
component: referentiels/update-action-commentaire, referentiels/update-action-statut
symptoms:
  - Incorrect previousValue recorded in history entries under concurrent writes
  - Duplicate or stale history records for the same (collectiviteId, actionId)
root_cause: >
  Plain SELECT (without row-level locking) used to read old values before upsert,
  allowing concurrent transactions to snapshot the same previousValue before either
  commits its update.
---

# Race condition in history tracking for action commentaires and statuts

## Problem

After migrating history tracking from PostgreSQL triggers to application-layer code (commit `6de972e2c`), the `UpdateActionCommentaireService` and `UpdateActionStatutService` read old row values with a plain SELECT before performing an upsert and saving history. Under concurrent writes to the same `(collectiviteId, actionId)`, both transactions read the same old value, producing incorrect `previousValue` in history entries.

```
Transaction A: SELECT oldRow (commentaire = "v1")
Transaction B: SELECT oldRow (commentaire = "v1")  -- same stale value
Transaction A: UPSERT commentaire = "v2", history(previous = "v1")  -- correct
Transaction B: UPSERT commentaire = "v3", history(previous = "v1")  -- should be "v2"
```

## Solution

### Root Cause

The read-then-write pattern inside a transaction without row locking. The upsert itself is safe (PostgreSQL handles the conflict), but the history tracking relies on the SELECT result being accurate at the time of the write.

### Fix

#### 1. Commentaire service (single-row upsert)

Add `.for('update')` to the SELECT that reads the old row:

```typescript
// apps/backend/src/referentiels/update-action-commentaire/update-action-commentaire.service.ts
const oldRow = await tx
  .select()
  .from(actionCommentaireTable)
  .where(and(
    eq(actionCommentaireTable.collectiviteId, collectiviteId),
    eq(actionCommentaireTable.actionId, actionId)
  ))
  .for('update')
  .then((rows) => rows[0] ?? null);
```

This forces the second concurrent transaction to wait until the first commits, so it reads the correctly updated value.

#### 2. Statut service (batch upsert) -- three changes

**a. Sort inputs by `actionId` to prevent deadlocks:**

```typescript
const sortedActionStatuts = [...actionStatuts].sort((a, b) =>
  a.actionId.localeCompare(b.actionId)
);
```

**b. Add `.orderBy(...).for('update')` to the batch SELECT:**

```typescript
const oldValues = await tx
  .select()
  .from(actionStatutTable)
  .where(and(
    eq(actionStatutTable.collectiviteId, collectiviteId),
    inArray(actionStatutTable.actionId, sortedActionIds)
  ))
  .orderBy(actionStatutTable.actionId)
  .for('update');
```

**c. Use `sortedActionStatuts` in the upsert values** so the write order matches the lock order.

### Drizzle ORM detail

Drizzle ORM v0.44.6 (pg-core) natively supports `SELECT ... FOR UPDATE` via `.for(strength, config?)`. No raw SQL needed. Valid strengths: `'update'`, `'no key update'`, `'share'`, `'key share'`. Config options: `{ noWait: true }` or `{ skipLocked: true }`.

### Known limitation

`FOR UPDATE` only locks rows that already exist. For the first-ever insert (no prior row), there is no row to lock, so a narrow race remains. Accepted as a minor edge case -- it only affects the initial insert where there is no meaningful prior history to corrupt.

## Prevention

### Rules

- **Trigger-to-application migration rule**: When moving logic from database triggers to application code, always ask: "Can two requests execute this simultaneously for the same row?" If yes, row-level locking is required.
- **Read-then-write = lock-then-read**: Any pattern where a SELECT result determines what to INSERT/UPDATE inside a transaction must use `SELECT ... FOR UPDATE`.
- **Batch lock ordering**: When locking multiple rows in a transaction, always sort by primary key before issuing SELECTs. Inconsistent ordering causes deadlocks.

### Drizzle ORM row locking

```typescript
// WRONG: race condition
const current = await tx.select().from(table).where(eq(table.id, id));

// RIGHT: locks the row until commit
const current = await tx.select().from(table).where(eq(table.id, id)).for('update');
```

### Code review checklist for history/audit patterns

- [ ] Is there a SELECT before an INSERT/UPDATE where the SELECT result determines the write? Verify `FOR UPDATE` is used.
- [ ] Are multiple rows locked? Verify they are locked in a deterministic order (sorted by PK).
- [ ] Was this logic previously in a database trigger? Verify concurrency was addressed in the migration.
- [ ] Is the transaction as short as possible? No external API calls or heavy computation while locks are held.

## References

- Commit `6de972e2c`: migration of history triggers to application layer
- Plan: `doc/plans/2026-04-14-001-refactor-select-for-update-history-race-condition-plan.md`
- ADR #12 (`doc/adr/0012-pattern-result.md`): TransactionManager pattern
- Files modified: `apps/backend/src/referentiels/update-action-commentaire/update-action-commentaire.service.ts`, `apps/backend/src/referentiels/update-action-statut/update-action-statut.service.ts`
- Read-path migration pattern (orthogonal context): `doc/solutions/architecture-patterns/supabase-to-trpc-with-computed-enrichment-2026-04-27.md` — useful when a new read repository touches the same `FOR UPDATE` consumers.
