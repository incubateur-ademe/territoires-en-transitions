---
title: "Zod `.default()` on a base schema silently overwrites fields in a `.partial()` update"
category: logic-errors
date: 2026-04-21
tags:
  - zod
  - trpc
  - partial-update
  - schema-composition
  - indicateurs
severity: medium
component: backend/indicateurs/definitions/mutate-definition
symptoms:
  - Toggling an indicateur as favori, then editing only the pilote, silently removes it from favoris
  - Marking an indicateur as confidentiel, then any partial update, resets it to public
  - Boolean fields omitted from an update payload get written to the database as `false` instead of being preserved
root_cause: >
  The update input schema spread its shape from a create schema whose boolean fields carried
  `.default(false)`. Wrapping that shape in `.partial()` makes fields optional at the type level
  but does NOT strip the `.default()` — Zod still fills `false` when the client omits the field,
  so the service layer's `field !== undefined` guard sees `false` and writes it to the database.
---

# Zod `.default()` on a base schema silently overwrites fields in a `.partial()` update

## Problem

Partial updates to an indicateur via `indicateurs.indicateurs.update` silently reset `estFavori` and `estConfidentiel` to `false` whenever the client sent any update payload that didn't include those fields. Toggling a favori and then editing the pilote via the edit modal would make the favori disappear; enabling "mode privé" and then changing anything else would make it public again.

## Symptoms

- User marks an indicateur as favori → edits the pilote → the star icon goes off.
- Confidentialité toggle state does not survive any other edit to the same indicateur.
- The UI sends exactly what was edited (`{ pilotes: [...] }`), and `estFavori` / `estConfidentiel` are never mentioned in the payload, yet they are written to `false` in the database.

## What Didn't Work

- **Reading the service layer first.** The service at `apps/backend/src/indicateurs/definitions/mutate-definition/update-definition.service.ts` already guards every field with `if (field !== undefined)` before writing. It looked correct. The bug wasn't in the service — it was in what the service received from the validated input.
- **Assuming `.partial()` strips defaults.** `.partial()` only changes whether a field is *required*, not whether it has a default. `z.boolean().optional().default(false)` still resolves to `false` when the input is `undefined`, even inside a `.partial()` wrapper.

## Solution

The update schema inherits field shapes from a create schema via `.shape` spread. In the create schema, the boolean fields legitimately default to `false` (a new indicateur without `estFavori` in the payload should be non-favori). The fix: explicitly `omit` those fields from the spread and redeclare them in the update schema *without* the default, so that omitting them produces `undefined` instead of `false`.

```ts
// apps/backend/src/indicateurs/definitions/mutate-definition/mutate-definition.input.ts

export const updateIndicateurDefinitionInputSchema = z.object({
  indicateurId: z.number(),
  collectiviteId: z.number(),
  indicateurFields: z
    .object({
      ...createIndicateurDefinitionInputSchema.omit({
        collectiviteId: true,
        ficheId: true,
        thematiques: true,
        estFavori: true,        // ← omit the defaulted field
        estConfidentiel: true,  // ← omit the defaulted field
      }).shape,

      // Redéfinis sans `.default(false)` pour que le service puisse distinguer
      // "absent du payload" de "explicitement mis à false".
      estFavori: z.boolean().optional(),
      estConfidentiel: z.boolean().optional(),
      // ...
    })
    .partial(),
});
```

After this change, the service's `if (estFavori !== undefined)` guard correctly skips writing the column when the client didn't send the field, preserving the stored value.

## Why This Works

`.default(false)` is a *transform* that fires at parse time whenever the input slot is `undefined`. `.partial()` changes the *requirement* of a field (optional vs. required) but leaves the default transform in place. So even with `.partial()`, any field with a default that is missing from the payload arrives at the handler as the default value — never as `undefined`.

The service layer was written correctly for a world where "absent" meant `undefined`. The schema was silently turning "absent" into `false`. The two contracts need to agree: if the service distinguishes `undefined` from `false`, the schema must not erase that distinction.

## Prevention

**Keep `.default()` out of update/partial schemas.** When deriving an update schema from a create schema:

- The create side owns "new object, fill in sensible defaults."
- The update side owns "change what I sent, leave the rest alone."

These are different contracts; they cannot share default behavior.

**Practical rule for this codebase:** when a base schema with `.default(...)` fields is reused via `.shape` + `.partial()` for an update, `omit` every defaulted field and redeclare it without the default. Add a comment so the next reader knows why.

**Test both directions.** A preserve-on-omit test is not enough; pair it with an explicit-reset test. Together they lock in the schema's two-way semantics:

```ts
// Preserve: absent fields stay as they were
await caller.update({ indicateurFields: { estFavori: true } });
await caller.update({ indicateurFields: { pilotes: [...] } });
expect(row.estFavori).toBe(true);

// Reset: explicit false actually resets
await caller.update({ indicateurFields: { estFavori: true } });
await caller.update({ indicateurFields: { estFavori: false } });
expect(row.estFavori).toBe(false);
```

**Structural fix for future fields.** The `omit + redeclare` pattern is not self-enforcing — the next developer who adds a `.default()` field to the create schema will silently repeat this bug. A stronger refactor is to extract a shared no-defaults base schema that both create and update derive from explicitly (create adds defaults on top; update stays bare). Worth doing the next time this file is touched for a non-trivial change.

## Related

- Commit `1201e3d5b` — "Préserve les favoris et la confidentialité lors d'une mise à jour partielle d'un indicateur"
- [Zod docs: `.default()`](https://zod.dev/?id=default)
- [Zod docs: `.partial()`](https://zod.dev/?id=partial)
