---
name: ds-publish
description: Republish the "Territoires en Transitions" design system (the claude.ai artifact of type Design System used by Claude Design) from packages/ui on main, file by file, only when @tet/ui or @tet/design-tokens changed since the published version. Use at the start of /proto-import, after a change to @tet/ui is merged (the design-system-export workflow asks for it), when someone says the design system in Claude Design is out of date, or when someone types /ds-publish.
argument-hint: '[--force]'
---

# /ds-publish — keep the Claude Design system in sync with `@tet/ui`

The design system that designers use in Claude Design is the artifact
**https://claude.ai/artifact/7Qrax7LhLsLyA5FxZX8PuP** (type « Design System »,
namespace `TeT`, `"editing": "code"`: it is only ever written from the code).
This skill republishes it from `main`. `/proto-import` runs it first, so a
prototyping session always starts from an up-to-date design system. The workflow
`.github/workflows/design-system-export.yml` checks on every merge that the
export still builds; publishing needs a Claude session, so it happens here.

Talk to the person in French. Read the artifact's own type instructions (the
`read` of the artifact returns them) before writing to it: they win on the
format of its files.

## 1. Is there anything to publish?

1. `read` `project/design-system.json` and `project/tokens.json` of the
   artifact. The published commit is the short SHA after `@` in
   `tokens.json` `meta.ref` (also in the index's `lastChange.via`).
2. `git fetch origin main`. If that commit is known locally and
   `git diff --quiet <commit> origin/main -- packages/ui packages/design-tokens`
   succeeds, there is nothing to publish: say so in one line and stop (unless
   `--force`).
3. Otherwise (a change, or a commit unknown after a squash merge), go on: the
   comparison of step 3 decides file by file.

## 2. Export from `main`

Export from a separate worktree of `origin/main`, so that the session's own
checkout and branch stay untouched (`/proto-import` runs this skill before its
own work). The worktree borrows the installed dependencies:

```bash
W=<scratchpad>/ds-main
git worktree add --detach "$W" origin/main
ln -s "$PWD/node_modules" "$W/node_modules"
for d in packages/*/ apps/*/; do
  [ -d "$d/node_modules" ] && ln -s "$PWD/$d/node_modules" "$W/$d/node_modules"
done
cd "$W"
pnpm exec nx typecheck ui        # the exported types come from out-tsc/lib
pnpm exec nx run ui:export-design-system -- --out <scratchpad>/ds-export
```

The export writes `<out>/project/` (tokens, fonts, README — the brand book
with the conformity rules of `rules.md` inserted —, logos, components with
their bundle) and `<out>/index-fields.json` (`namespace`, `libraries`);
`meta.ref` reads `HEAD@<short SHA>` from a detached worktree. A failing export
stops here: report its error, publish nothing. Remove the worktree when done
(`git worktree remove --force "$W"`), whatever the outcome.

## 3. Compare with what is published

1. `list` the artifact's files (`scope: "files"`), then `read` every
   `project/…` path (`paths`, at most 256 per call) to get each one's sha256;
   compare with `sha256sum` of the exported files.
2. The plan:
   - **write**: exported files that are new or whose hash differs, except
     `assets/Logos/*.svg|png` and `design-system.json`;
   - **remove** (`null`): published `project/components/<Name>/…` paths whose
     component the export no longer has. Never remove anything else;
   - **logos**: an exported logo whose size differs from its record in
     `assetGroups.Logos.files` is uploaded again (`asset: true`) and its
     record updated; an identical one keeps its record.
3. Only `tokens.json` differing (its `meta.ref` changes on every export): the
   code did not change what designers see. Publish nothing, say so.

## 4. Publish

One Artifact call (`url` above, `root` = `<out>`, `file_path` = one changed
file by its absolute path, `files` = the other changed paths and the `null`
removals, plus the index). Type declarations (`*.d.ts`) are not a served type:
pass each as `{"from": "<path>", "contentType": "text/plain"}`, as they are
already published. The index goes last and once: `read`
`project/design-system.json` again right before, keep every key and its
`createdOnFiles` marker, and set only:

- `libraries` from `index-fields.json`;
- the logo records you changed;
- `lastChange`: `{"by": "Claude", "at": "<now, ISO-8601>", "via": "GitHub · incubateur-ademe/territoires-en-transitions@<short SHA of origin/main>", "note": "<what changed for designers, in French, one sentence>"}`.

Refused because someone saved meanwhile: read those files again and redo the
plan once; a second refusal, stop and report.

## 5. Report

In French: the link, the published commit, the components added, changed or
removed, and the reminder that existing designs keep their installed copy
until they are touched again (the README asks Claude Design to refresh it
then).

## Rules

- Publish only from `origin/main`, never from a working branch.
- Never write `api/` cards or `manifest.json`, and never create a second
  design system: always this URL.
- Never hand-edit an exported file to make it publish: a refusal from the
  artifact service is a bug of the export, to fix in
  `packages/ui/scripts/design-system-export/` through a pull request.
