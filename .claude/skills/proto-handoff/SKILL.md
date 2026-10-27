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
identifiers as they are.

## 1. Inputs

- `slug`: the prototype's route. Ask for it if missing.
- The prototype: `apps/prototypes/app/<slug>/` on `proto/<slug>` (fetch and
  check out that branch), its entry in `apps/prototypes/src/prototypes.ts`.
- Its draft pull request (head `proto/<slug>`): its description holds the
  Claude Design canvas link, the artifact link and the step 3 table of
  `/proto-import`. No pull request: stop and say that `/proto-import` step 7
  comes first.

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

Collect, as **open questions**, every point the prototype does not settle:
a divergence from the existing app (the prototype shows a flat list where the
app groups by axes…), a data definition that is ambiguous (which amount is
"the budget"?), an access rule (restricted data), a proposal that changes
`@tet/ui`.

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
4. Report in French: the pull request link, the counts (existe / à adapter /
   à créer), the open questions to settle before implementation.

## Rules

- Never implement in `apps/app`, `apps/backend` or `packages/ui`, and never
  change the prototype itself: a gap found here becomes an open question.
- Never trigger a paid AI feature to check a data flow (see the root
  `CLAUDE.md`).
- One pull request per prototype: update it, never open a second one.
