---
name: proto-handoff
description: Hand a validated prototype of apps/prototypes over to the developers who will implement it in apps/app. Writes apps/prototypes/app/<slug>/handoff.md (links, mapping of every element to what already exists in apps/app and apps/backend, proposals to decide, data, open questions) and turns the prototype's draft pull request into a ready-for-review one. Use when the design of a prototype made with /proto-import is settled, or when someone types /proto-handoff <slug>.
argument-hint: <slug>
---

# /proto-handoff — from a validated prototype to a developer handoff

`/proto-import` produced a prototype on `proto/<slug>`, with a draft pull
request and an artifact, and iterated on it with the designer. This skill runs
once the design is settled: it tells the developer what the prototype maps to
in the real app, so that the implementation starts from the existing code, not
from a copy of the prototype. It implements nothing.

Write the handoff in French (it is read by the team); keep code, paths and
identifiers as they are. The conformity rules R1–R8 are in
`packages/ui/scripts/design-system-export/rules.md`; the flow, roles and
gates in `doc/design-flow.md`.

## 1. Inputs

- `slug`: the prototype's route. Ask for it if missing.
- The prototype: `apps/prototypes/app/<slug>/` on `proto/<slug>` (fetch and
  check out that branch), its entry in `apps/prototypes/src/prototypes.ts`.
- Its draft pull request (head `proto/<slug>`): its description holds the
  Claude Design canvas link, the artifact link and the step 3 table of
  `/proto-import`. No pull request: stop and say that `/proto-import` step 7
  comes first.

Open gaps block the handoff (R7, R8). Read the « Écarts à trancher » section of the pull
request description: design gaps (a need off the design system) and canvas
gaps (a change decided during the import but not made in the canvas, a canvas
setting the prototype does not reproduce). If it lists anything, stop: list
each item for the person who ran the skill, and ask the designer to settle it
in Claude Design (apply the conforming option or the decided change in the
canvas, or flag the need as a « Proposition : … » note), then to run
`/proto-import` again, which refreshes the section. A description without that
section comes from an older import: run `/proto-import` again first. Go on
only when it reads « Aucun ».

## 2. Read the prototype

List what the page shows and does, top to bottom: each block, each
interaction (`useState`), each fixture type and field, each file of
`proposals/` with its `Besoin`.

## 3. Map it to the real app

For every element of step 2, find what already exists. Delegate the search to
an `Explore` agent when it spans many files, and give it the element list.
Look in:

- `apps/app/app/` and `apps/app/src/<domain>/`: the route where this page
  would live, the components, hooks and contexts that already render or load
  the same thing, the existing UI for the same interaction (a filter, a
  creation button…);
- `apps/backend/src/<domain>/`: the tRPC procedure that serves each fixture
  field (router, service, output field name), or its absence;
- `packages/ui`: whether a proposal has an equivalent already.

Classify each element as **existe** (reuse as is), **à adapter** (exists,
needs a change: say which) or **à créer**. Every claim cites a
repository-relative path; read the code before writing it, never infer it
from a name.

Collect every point the prototype does not settle, in two kinds:

- **design decisions**: what the page shows or does, which only the designer
  or the product owner can decide. Typically a divergence from the existing
  app (the prototype drops content the current component shows, changes a
  label, a format, a density, an interaction such as a menu always visible
  instead of on hover), or a proposal that changes `@tet/ui`;
- **technical questions**: how to serve or compute what the page shows, which
  the developer settles. Typically a data definition (which amount is "the
  budget"?), a missing field in an endpoint, an access rule (restricted
  data), performance (one call per card).

Design decisions block the handoff like gaps do: when there are any, write
`handoff.md` with them under « À trancher par le design », but stop before
step 5: commit and push it, list them in the pull request description, leave
the pull request in draft, and ask the designer or the product owner to
answer. Run this skill again once they are answered: they move to the
mapping, and only technical questions stay open.

Also write the **scope** of the change: every route and component of the app
the implementation will touch (the component the prototype replaces and each
place that uses it, the pages that show it), so the product owner sees what
changes beyond the prototype's page.

## 4. Write `handoff.md`

`apps/prototypes/app/<slug>/handoff.md`, from [handoff.template.md](handoff.template.md).
Keep it to what a developer needs to start: no restating of the prototype's
code, no implementation plan beyond the mapping. Then:

```bash
pnpm exec prettier --write apps/prototypes/app/<slug>/handoff.md
```

## 5. Hand over

1. Commit `handoff.md` on `proto/<slug>` and push.
2. Update the pull request description: add a link to `handoff.md` and its
   open questions, replace the draft line with « Prêt pour revue : le design
   est validé, voir handoff.md. »
3. Mark the pull request **ready for review**. Running this skill is the
   confirmation that the design is settled; if the person who ran it says it
   is not, leave it in draft.
4. Report in French: the pull request link, the scope, the counts (existe /
   à adapter / à créer), the technical questions left to the developer.

## Rules

- Never implement in `apps/app`, `apps/backend` or `packages/ui`, and never
  change the prototype itself: a gap found here becomes an open question.
- Never trigger a paid AI feature to check a data flow (see the root
  `CLAUDE.md`).
- One pull request per prototype: update it, never open a second one.
