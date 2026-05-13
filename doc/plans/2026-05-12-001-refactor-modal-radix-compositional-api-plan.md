---
title: "refactor(ui): Migrate Modal to Radix UI with a compositional API"
type: refactor
status: active
date: 2026-05-12
deepened: 2026-05-12
pivoted: 2026-05-12
---

# refactor(ui): Migrate Modal to Radix UI with a compositional API

## Pivot 2026-05-12 (afternoon) — Structure-only V1

After receiving the Figma reference, scope tightened further:

- **No styling in V1**. The two new components ship with **zero Tailwind classes beyond behavior** (sticky positioning, overflow). Visual design lands in a separate PR once structure is validated against the 3 migrated sites.
- **5 sizes typed but unstyled** — `'xs' | 'sm' | 'md' | 'lg' | 'xl'` per Figma (480/640/800/960/1200 px), accepted as a prop, emitted as `data-modal-size="X"` for later CSS. No `max-width` enforced yet.
- **`Modal.Description` kept** (option b) — optional sub-component that renders a plain `<p>` (no styling) and wires `aria-describedby` for the 17 sites needing it. Will be styled or moved later.
- **`Modal.Header` added** as a structural sub-component (Figma treats Title + Subtitle + Close X as a distinct sticky zone). Body becomes scrollable, Footer sticky.

## Pivot 2026-05-12 — Incremental approach

After deepening (full big-bang plan with codemod of 108 files + 16-prop adapter), we pivoted to an **incremental, bedrock-first** strategy. Rationale:

- A codemod-driven big bang means committing to API decisions before seeing them under real call sites. Too much room for over-engineering.
- 96 of the 108 call sites share **the same simple shape**: title + body + OK/Cancel. The "edge cases" are a long-tail (subTitle is the only one used at scale).
- The previous deepened plan accumulated complexity (`pending` prop, granular `dismissable`, motion choreography, `useModalContext`, codemod 4 shapes, 23 risks) that may or may not be needed — we don't know until we try.
- Cohabitation with the existing `Modal` is cheap (the `TabsNext` precedent shows the pattern works), so we can ship `ModalNext` + `AlertModal` as new components and migrate progressively without disrupting the 100+ existing call sites.

This plan now describes **the bedrock build + the migration of 3 representative sites**. Edge cases get challenged sequentially in follow-up phases, each adding only what's empirically needed.

The earlier deepened-plan content is preserved further down (Alternatives, System-Wide Impact, etc.) as background research, but the operational sections (Overview, Solution, Implementation Phases, Acceptance Criteria) are rewritten for the incremental approach.

---

## Overview

Build **two new, distinct components** in the design system, alongside the existing `Modal`:

- **`ModalNext`** — wraps Radix `Dialog`. The neutral, non-destructive variant.
- **`AlertModal`** — wraps Radix `AlertDialog`. The destructive/blocking variant with `role="alertdialog"`, no outside-click dismissal, focus on Cancel by default.

Both expose the same anatomy (Title, Subtitle, Description, Body, Footer + action buttons) so the mental model transfers cleanly between them. Only the action buttons differ: `Modal.Ok` vs `AlertModal.Action`.

The existing `Modal` stays untouched. Migration is **per-site, manual, on demand**. Codemod adoption deferred to a later phase once the API is stabilized by real usage.

---

## Problem Statement

The existing `@tet/ui` `Modal` (built on `@floating-ui/react`) accumulated 16 props, 3 content-rendering mechanisms (`render`, `renderFooter`, `cloneElement`-trigger via `children`), a `btnOKProps`/`btnCancelProps` props-bag footer, and several rule violations (`classnames` instead of `cn`, `!important` in Tailwind, `zIndex` dead-code prop, `dataTest` instead of ARIA roles). Detailed audit available in earlier versions of this plan / the conversation thread.

The incoming Figma redesign + 96 occurrences of `ModalFooterOKCancel` make this the right moment to replace the surface.

### Usage at a glance (verified 2026-05-12)

| Symbol | Files | Notes |
|---|---|---|
| `<Modal>` JSX | ~108 / 170 occurrences | Apps + packages combined |
| `openState=` (control pattern) | 155 files / 368 mentions | Includes wrapper components re-exporting `openState: OpenState` |
| `ModalFooterOKCancel` | 96 consumers | Dominant footer pattern — the bedrock case |
| `ModalFooter` raw | 24 consumers | |
| `ModalFooterSection` | 9 consumers | |
| `ModalFooterOKCancelWithSteps` | 1 consumer | Wizard, will be inlined into caller |
| `subTitle=` prop | 41 sites | **Kept in V1 API** |
| `description=` prop | 0 sites direct, ~17 via render-prop `descriptionId` | **Kept in V1 API** as `Modal.Description` |
| `noCloseButton` | 5 sites | |
| `disableDismiss` | 10 sites | |
| `backdropBlur` | 3 sites (auth) | |
| `footerIsAlwaysVisible` | 0 sites | Dropped |
| `zIndex` prop | 0 effective uses | Dropped (dead code) |
| `render={({ ref })}` | 1 site (`ChartModal.tsx`) | |

---

## Proposed Solution — V1 minimum surface

### Architecture

```
packages/ui/src/design-system/
├── Modal/                          ← UNCHANGED, existing component
├── ModalNext/                      ← NEW
│   ├── Modal.next.tsx
│   ├── Modal.next.stories.tsx
│   └── index.ts
└── AlertModal/                     ← NEW
    ├── AlertModal.tsx
    ├── AlertModal.stories.tsx
    └── index.ts
```

Both new components are exported from `@tet/ui` via the main barrel (`packages/ui/src/index.ts`).

### Dependencies

Add to root `package.json` (aligned with existing convention — `@radix-ui/react-dropdown-menu` and `@radix-ui/react-slider` are already declared as individual packages):

```json
"@radix-ui/react-dialog": "^1.1.x",
"@radix-ui/react-alert-dialog": "^1.1.x"
```

No Earthfile change needed (per `reference_pnpm_workspace_pkg_not_found_earthly`, only new workspace packages trigger that gotcha — new npm deps on existing `packages/ui` are already covered).

### `ModalNext` — 9 sub-components (anatomy aligned with Figma)

```tsx
<Modal open={isOpen} onOpenChange={setIsOpen} size="md">
  <Modal.Header>
    <Modal.Title>Modifier le commentaire</Modal.Title>
    <Modal.Subtitle>Source : Audit climat 2024</Modal.Subtitle>
  </Modal.Header>
  <Modal.Body>
    <Modal.Description>Précisions sur la valeur saisie.</Modal.Description>
    <Field title="Commentaire">
      <Textarea value={value} onChange={handleChange} />
    </Field>
  </Modal.Body>
  <Modal.Footer>
    <Modal.Cancel>Annuler</Modal.Cancel>
    <Modal.Ok onClick={handleSave}>Valider</Modal.Ok>
  </Modal.Footer>
</Modal>
```

Note: `Modal.Header` carries the close X automatically (no `Modal.Close` sub-component exposed). Body is scrollable, Header + Footer are sticky (per Figma).

**API**:

```ts
type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: 'md' | 'lg';              // V1: 2 sizes only. Add sm/xl when first real need lands.
  dismissable?: boolean;           // V1: boolean only, default true
  children: React.ReactNode;
};

// All sub-components accept className for caller overrides
type ModalTitleProps       = { children: React.ReactNode; className?: string };
type ModalSubtitleProps    = { children: React.ReactNode; className?: string };
type ModalDescriptionProps = { children: React.ReactNode; className?: string };
type ModalBodyProps        = { children: React.ReactNode; className?: string };
type ModalFooterProps      = { children: React.ReactNode; className?: string };
type ModalOkProps          = ButtonProps;   // pass-through, default variant="primary"
type ModalCancelProps      = ButtonProps;   // pass-through, default variant="outlined", composes onClick with Radix close
```

**Internal behavior**:
- Close button (X) **always rendered** in the top-right of `Modal.Content`. Hide it via `dismissable={false}` (which also disables ESC + outside-click).
- `Modal.Title` is required (Radix throws otherwise).
- `Modal.Description` registers an `aria-describedby` chain automatically. When omitted, the Modal injects `aria-describedby={undefined}` on Content to silence Radix's missing-id warning.
- `Modal.Cancel` is wrapped in Radix `Dialog.Close asChild` — caller `onClick` runs first, then close.
- `Modal.Ok` does NOT auto-close. Caller closes explicitly after async success.
- Sub-components attached as static properties: `Modal.Title = ModalTitle` (TabsNext precedent).

### `AlertModal` — 8 sub-components

```tsx
<AlertModal open={isOpen} onOpenChange={setIsOpen}>
  <AlertModal.Title>Supprimer la sous-action</AlertModal.Title>
  <AlertModal.Subtitle>{sousAction.titre}</AlertModal.Subtitle>
  <AlertModal.Description>Cette action est définitive.</AlertModal.Description>
  <AlertModal.Body>
    Êtes-vous sûr de vouloir supprimer cette sous-action ?
  </AlertModal.Body>
  <AlertModal.Footer>
    <AlertModal.Cancel>Annuler</AlertModal.Cancel>
    <AlertModal.Action onClick={handleDelete}>Supprimer</AlertModal.Action>
  </AlertModal.Footer>
</AlertModal>
```

**API**: identical anatomy as `Modal` minus:
- No `size` prop (alertdialogs are always compact)
- No `dismissable` prop (Radix `AlertDialog` blocks outside-click by default; ESC closes)
- No close X button (Radix `AlertDialog` doesn't expose `Close`)
- Action button named `Action`, not `Ok`, to match Radix semantics and signal "this has consequences"

**Internal differences from `Modal`**:
- `role="alertdialog"` (Radix-managed)
- Default focus on `AlertModal.Cancel` (Radix-managed, destructive safety)
- `AlertModal.Action` accepts `ButtonProps` — caller chooses `variant="primary"` or styles via className for destructive look

### What's deliberately NOT in V1

These are deferred to follow-up phases, each justified by real usage when the migration encounters them:

| Deferred | Why deferred |
|---|---|
| `Modal.Trigger asChild` | 12 sites use this. Migration converts them to controlled mode (`useState` + open/onOpenChange). Adds `Modal.Trigger` later only if call sites prove the controlled-only pattern is painful. |
| `Modal.FooterGroup` / multi-cluster footer | 9 sites use `ModalFooterSection`. Caller can do `<div className="flex gap-3">` inside `Modal.Footer` for V1. Adds a dedicated component when the 9 migrations confirm the need. |
| Granular `dismissable: { escape, outside }` | 0 sites need granularity today. Boolean is enough. |
| `backdrop="blur"` | 3 sites (auth). Caller can pass className via `Modal` if exposed, or accept the visual regression of 3 sites. Decide when migrating those 3. |
| `dataTest` prop | 1 e2e selector relies on this (`labellisations.pom.ts`). Fixed directly when migrating that file. |
| `useModalContext()` hook | 0 sites need it in the bedrock cases. Adds the hook when first real case requires it (likely the wizard inlining). |
| `Modal.Ok pending` first-class prop | Caller uses `disabled={isPending}` standard Button prop. Promote to first-class only if the migration of destructive sites surfaces a real ergonomic pain. |
| Codemod | Wait until 5-10 sites are migrated by hand. Codemod is built once the API has been stress-tested empirically. |
| `Modal` deletion + bulk migration | Last phase, when all edge cases are settled. |

The principle is: **add when proven needed, not when imagined needed.**

---

## Implementation Phases

### Phase 0 — Build + Migrate 3 sites — ~0.5 day

**Goal**: ship working `ModalNext` + `AlertModal` and prove they handle 3 dominant patterns. Report friction, iterate.

#### Tasks

1. **Install Radix deps** at repo root:
   ```bash
   pnpm add @radix-ui/react-dialog @radix-ui/react-alert-dialog -w
   ```

2. **Create `packages/ui/src/design-system/ModalNext/Modal.next.tsx`** (single file, static-property assignment pattern from `TabsNext`).

3. **Create `packages/ui/src/design-system/AlertModal/AlertModal.tsx`** (single file, same pattern).

4. **Create barrel exports** (`index.ts` in each folder) and add to `packages/ui/src/index.ts`.

5. **Minimal stories** for each component (1-2 stories per: default + with all sub-components present).

6. **Migrate 3 sites**:

   **Site 1 — `apps/app/src/plans/sous-actions/delete-sous-action.modal.tsx` → `AlertModal`**
   - Validates: AlertModal anatomy, Subtitle, Description, destructive flow
   - Caveat: the current site uses the `descriptionId` render-prop pattern with a centered `<div>` — we drop that, the `<Modal.Description>` handles `aria-describedby` natively.

   **Site 2 — `apps/app/src/plans/plans/create-plan/create-plan.modal.tsx` → `Modal`**
   - Validates: Modal anatomy in controlled mode, custom Body content (`CreatePlanOptionLinksList`)
   - Caveat: current site uses `children` as trigger AND has a centered single-Cancel footer. Migration: refactor the wrapper to no longer accept `children` (callers control `openState`), and the single Cancel button becomes `<Modal.Footer><Modal.Cancel>Annuler</Modal.Cancel></Modal.Footer>` (right-aligned). This is a minor UX shift to discuss with design if it matters; the `create-plan.button.tsx` caller is updated in the same PR.

   **Site 3 — `apps/app/src/app/pages/collectivite/Indicateurs/table/edit-commentaire-modal.tsx` → `Modal`**
   - Validates: Modal anatomy with form, `dismissable={false}` (current `disableDismiss`), branch-by-readonly footer
   - Caveat: the readonly branch renders a single Fermer button (no OK/Cancel). Migration: keep the branch, use `<Modal.Footer><Modal.Cancel>Fermer</Modal.Cancel></Modal.Footer>` in readonly mode.

7. **Verify the 3 sites typecheck + render + e2e-pass** (if e2e specs target these sites).

#### Exit criteria

- [ ] `pnpm typecheck` passes across the monorepo
- [ ] 3 sites render visually correctly (manual smoke: open, ESC, click-outside, focus return, keyboard)
- [ ] Site 1 emits `role="alertdialog"` (verified via DevTools)
- [ ] Site 1's "Are you sure" body is announced correctly by a screen reader (manual axe-core OR VoiceOver smoke)
- [ ] No Radix dev-mode warnings about missing Title / orphan aria-describedby
- [ ] `pnpm build` of `apps/app` produces no hydration warnings
- [ ] Existing e2e tests for these 3 sites still pass (or selectors updated in the same PR)

#### Friction log

A `.claude/todos/modal-next-friction.md` (gitignored) tracks every friction point encountered during the 3 migrations. Each entry: site + problem + chosen workaround + question for next phase. This is the input for Phase 1's challenge decisions.

### Phase 1 — Challenge edge cases progressively — ~1-2 days, spread over multiple PRs

For each edge case, migrate **at least 2 representative sites** before deciding whether to add an API affordance or stick with workarounds. Order by frequency to maximize learning early:

#### Edge case 1 — `subTitle` (41 sites)
**Already covered in V1** via `<Modal.Subtitle>`. Validate during Phase 0 if any of the 3 sites has it. Otherwise migrate 2 sites with subtitle in this phase to confirm rendering.

#### Edge case 2 — `disableDismiss` (10 sites)
**Already covered in V1** as `dismissable={false}`. Validate via site 3 in Phase 0.

#### Edge case 3 — `noCloseButton` (5 sites)
Today the X button is always rendered when not using `noCloseButton`. In V1, the X is rendered by default and `dismissable={false}` also hides it (conflated). Two options:
- **(a)** Keep conflated — `dismissable={false}` is the only way to hide the X.
- **(b)** Split — add `closeButton?: boolean` (default true) separate from `dismissable`.

Decide after migrating 2 sites from the 5 candidates. Likely (a) is fine.

#### Edge case 4 — `Modal.Trigger asChild` (12 sites)
Currently 12 sites use the `cloneElement` trigger pattern. In V1 they migrate to controlled mode with local `useState`. Migrate 2-3 sites; if the controlled-only pattern feels painful (e.g. ergonomic loss > 5 LoC per site), add `Modal.Trigger asChild` to the API. Otherwise stay controlled-only.

#### Edge case 5 — `Modal.Description asChild` (3 sites pointing onto `FormSectionGrid`)
The `ActionsGroupeesModale` pattern needs `aria-describedby` to point at a `FormSectionGrid`, not a `<p>`. Options:
- **(a)** Add `asChild` to `Modal.Description` only (3 sites benefit).
- **(b)** Expose `useModalContext()` so the caller wires `id={descriptionId}` manually.

Decide after attempting both on 1 site. Likely (a) is cleaner.

#### Edge case 6 — `backdrop="blur"` (3 auth sites)
Three options:
- **(a)** Add `backdrop?: 'scrim' | 'blur'` prop.
- **(b)** Expose `<Modal.Overlay>` for caller composition.
- **(c)** Accept the visual regression — auth modals lose blur.

Decide when migrating the 3 sites. Likely (a) for a single prop.

#### Edge case 7 — Multi-cluster footer (9 `ModalFooterSection` sites)
Caller does `<div className="flex gap-3">` inside `Modal.Footer` in V1. If 9 sites do this identically, extract `Modal.FooterGroup` after migrating 3.

#### Edge case 8 — Custom footer alignment (e.g. site 2 `justify-center`)
The current `Modal.Footer` is `flex justify-end gap-3`. With `cn` + tailwind-merge, caller can override via className. Try this approach; if it's awkward, add `align?: 'end' | 'between' | 'center'` (we already discussed dropping `center`, but if the data demands it, add it).

#### Edge case 9 — `dataTest` for 1 e2e selector
Fix the e2e selector when migrating that site (`labellisations.pom.ts`). Don't carry a Modal-level `dataTest` prop.

#### Edge case 10 — `ref` forwarding for `html2canvas` (1 site, `ChartModal`)
`Modal.Content` accepts `ref` as a prop (React 19 ref-as-prop). Validate when migrating ChartModal.

#### Edge case 11 — Wizard with steps (`ModalFooterOKCancelWithSteps`, 1 site)
Inline the wizard logic into the caller (`tdb-pa-fiches-action-count.modal.tsx`) using local state + `Modal.Footer` composition. No DS support for wizards.

### Phase 2 — Bulk migration via codemod — ~1 day

Once the API has been validated and stabilized by Phase 1 (typically 10-20 sites migrated by hand, all edge cases settled), write a `jscodeshift` codemod for the long tail (~80-90 remaining sites). Approach:

- Single transform shape (`openState` leaf with `title` + `render` + `renderFooter` OKCancel → compositional `Modal`).
- Conservative `CODEMOD-REVIEW:` markers for ambiguous cases.
- Wave commits by directory for `git bisect` friendliness.
- Wrapper components (`BaseUpdateFicheModal`, `ActionsGroupeesModale`, `Edition*` family) migrate first.

This phase is scoped only when Phase 1 closes — we may decide manual migration is faster than building a codemod for the long tail.

### Phase 3 — Delete old Modal — ~0.5 day

- Delete `packages/ui/src/design-system/Modal/Modal.tsx` and `ModalFooter*` files.
- Rename `ModalNext` → `Modal` (find/replace across the monorepo, since all sites already migrated).
- Update `packages/ui/src/index.ts` barrel.
- Update any e2e selectors still using `data-test="Modal"` derivatives.
- Clean adjacent `classnames` debt in `packages/ui/src/shadcn/slider.tsx` + `dropdown-menu.tsx` (5 LoC).
- `/ce:compound` learnings (see Documentation Plan below).

---

## Acceptance Criteria

Scoped to **Phase 0** (the bedrock + 3 sites). Subsequent phases get their own criteria as they're scoped.

### Functional

- [ ] `ModalNext` exports `Modal` with sub-components: `Title`, `Subtitle`, `Description`, `Body`, `Footer`, `Ok`, `Cancel`.
- [ ] `AlertModal` exports `AlertModal` with sub-components: `Title`, `Subtitle`, `Description`, `Body`, `Footer`, `Action`, `Cancel`.
- [ ] Both exported from `@tet/ui` main barrel.
- [ ] Site 1 (`delete-sous-action.modal.tsx`) migrated to `AlertModal`, renders identically to baseline.
- [ ] Site 2 (`create-plan.modal.tsx`) migrated to `Modal`, renders identically to baseline (modulo footer alignment shift if accepted).
- [ ] Site 3 (`edit-commentaire-modal.tsx`) migrated to `Modal`, both readonly and editable branches work.
- [ ] No existing `Modal` consumer touched (only the 3 sites + their direct wrappers).

### Non-Functional

- [ ] **A11y**:
  - `role="dialog"` on `Modal`, `role="alertdialog"` on `AlertModal`.
  - Title required (Radix-enforced).
  - No orphan `aria-describedby`.
  - Focus trap + return.
  - Default focus on Cancel for `AlertModal`.
- [ ] **Style hygiene**:
  - `cn` from `@tet/ui` (no `classnames`).
  - No `!` Tailwind.
  - No hardcoded hex colors (use `bg-overlay`, `z-modal`, `primary-*`, `grey-*` tokens).
  - No `T*` prefix on types.
  - Explicit return types on all exported components and hooks (`feedback_explicit_return_types`).
  - Components named for intent (`ModalTitle`, not `ModalH3`).
- [ ] **Compatibility**:
  - `apps/app build` + `apps/auth build` both succeed (per `feedback_verify_workspace_pkg_consumers`).
  - No hydration warnings in Next.js App Router production build.
- [ ] **Stories**:
  - At least 1 default story per component, validating Chromatic baseline.

### Documentation

- [ ] `Modal.next.tsx` JSDoc covers: `asChild` event composition (Cancel's `onClick` runs before Radix close), required `Modal.Title`, the V1 limitations list (no Trigger, no FooterGroup, no granular dismissable).
- [ ] `AlertModal.tsx` JSDoc covers: differences from `Modal` (no Close X, no outside-click dismiss, focus on Cancel).

---

## Success Metrics (Phase 0 only)

| Metric | Target |
|---|---|
| New code LoC (`Modal.next.tsx` + `AlertModal.tsx`) | ≤ 350 combined |
| Number of sub-components | 8 per component (16 total, half shared in spirit) |
| Sites migrated in Phase 0 | 3 |
| Friction items logged for Phase 1 | tracked, no target |
| Bundle size impact | ≤ +12 KB gzipped (Dialog + AlertDialog + shared Radix primitives) |

Long-term targets (Phase 2-3) preserved from the deepened plan but scoped on completion of the bedrock.

---

## Risk Analysis & Mitigation

Scoped to Phase 0. Risks from the deepened plan that apply to bulk migration (codemod robustness, wrapper cascade) are deferred until Phase 2 is scoped.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Radix #3700 hydration mismatch under Next.js App Router with React 19 | Medium | Medium | Test `apps/app build` in Phase 0 exit. If encountered, wrap `Modal.next.tsx` in `'use client'` or pin Radix to a fixed version. |
| R2 | Body scroll lock leak (shadcn #6988) on rapid open/close or route transition | Low | Low | Manual smoke during Phase 0; if observed, plain CSS escape hatch in a colocated `modal.next.css`. |
| R3 | Site 2 (`create-plan`) footer alignment regression (`justify-center` → `justify-end`) | Certain | Low | Confirm with design as a one-off visual diff during PR review. If rejected, override via `className="justify-center"` on `Modal.Footer` (`cn` + tailwind-merge supports this). |
| R4 | Site 2's `children`-as-trigger pattern breaks: `create-plan.button.tsx` caller needs refactor | Certain | Low | Update both files (modal + caller) in the same PR. Caller becomes responsible for `useState` + opening. |
| R5 | `Modal.Description` `aria-describedby` regression vs current `descriptionId` render-prop wiring | Low | Medium | Both sites that use `descriptionId` today (Site 1 in Phase 0, ActionsGroupeesModale in Phase 1) are migrated explicitly. Verify with DevTools / axe-core. |
| R6 | `useOpenState` API mismatch — 5 other DS components still use it after Modal stops | Low | Low | `useOpenState` untouched in Phase 0. Modal.Next consumers use raw `useState` for now. If awkward, add `open`/`onOpenChange` aliases on `useOpenState` later (additive, non-breaking). |
| R7 | Tailwind-merge precedence on `className` overrides not working as expected | Low | Low | `cn` already uses `twMerge` (`packages/ui/src/utils/cn.ts`). Validated. |
| R8 | Static-property assignment (`Modal.Title = ModalTitle`) doesn't auto-complete cleanly in TS | Low | Medium | TabsNext precedent shows it works. Validate during Phase 0 implementation. |
| R9 | Cohabitation noise — two `Modal` symbols (existing + new) in the barrel | Certain | Low | New components named `Modal` (from `ModalNext`) and `AlertModal`. Old `Modal` keeps its current export name. They can coexist; Phase 3 renames new → old. |

Risks deferred to later phases (preserved as reference): destructive-vocabulary heuristic (Phase 2 codemod), form-in-modal `type="submit"` (Phase 2 codemod), context re-render storm (Phase 1 when context is introduced), Windows scrollbar shift (Phase 1+ if it becomes visible).

---

## Future Considerations (deferred from V1)

Preserved from the deepened plan, contingent on Phase 1 findings:

- **`Modal.Ok pending` first-class prop** — adds `aria-busy` + auto-disables ESC/outside-click/X during pending state. Add if Phase 1 destructive-confirmation migrations show the pattern is duplicated everywhere.
- **`Modal.Trigger asChild`** — add if the controlled-only migration of the 12 trigger sites proves painful.
- **`Modal.FooterGroup`** — add when 3+ sites need multi-cluster footers after Phase 1.
- **`Modal.Description asChild`** — likely added in Phase 1 (3 sites).
- **`useModalContext()`** — add when first real consumer needs it.
- **Granular `dismissable: { escape, outside }`** — add when first real differentiation need surfaces.
- **`backdrop` prop** — likely added in Phase 1 (3 auth sites).
- **Sizes `sm` / `xl`** — add when needed.
- **Mobile bottom-sheet pattern** — add as part of the visual redesign rollout.
- **Motion choreography via `data-state`** — add as part of the visual redesign rollout.
- **`scrollbar-gutter: stable` globally** — add as a pre-emptive layout-shift mitigation, not blocked on Modal scope.
- **ADR-0011 (Radix as DS primitive baseline) + ADR-0012 (Closed enums vs open composition)** — write when 2-3 components have migrated and the pattern is established.
- **ESLint rule forbidding direct `@radix-ui/*` imports in `apps/*`** — add alongside ADR-0011.
- **Codemod for bulk migration** — Phase 2.
- **`useConfirm()` imperative API** — V2.
- **Drawer / Sheet sub-component** — independent component when first needed.

---

## Sources & References

### Internal

- TabsNext (only static-composition precedent): `packages/ui/src/design-system/TabsNext/Tabs.next.tsx:171-173`.
- Existing shadcn Radix wrappers: `packages/ui/src/shadcn/slider.tsx`, `packages/ui/src/shadcn/dropdown-menu.tsx`.
- Current `Modal`: `packages/ui/src/design-system/Modal/Modal.tsx` (kept untouched in V1).
- `cn` utility: `packages/ui/src/utils/cn.ts` (uses `tailwind-merge` for className overrides).
- Design tokens used: `colors.overlay` and `zIndex.modal` from `packages/design-tokens/src/design-tokens.ts`.
- Button types: `packages/ui/src/design-system/Button/types.ts`.
- Existing Radix deps in root `package.json`: `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slider` (validates the individual-package convention).
- 3 migration target sites:
  - `apps/app/src/plans/sous-actions/delete-sous-action.modal.tsx`
  - `apps/app/src/plans/plans/create-plan/create-plan.modal.tsx`
  - `apps/app/src/app/pages/collectivite/Indicateurs/table/edit-commentaire-modal.tsx`

### Institutional knowledge

- `compound-knowledge-db/docs/plans/2026-05-06-002-feat-modale-cloture-audit-deux-etapes-plan.md` — WCAG 2.2 AA expectations for modals (reference for Phase 1 a11y validation).
- `compound-knowledge-db/docs/solutions/design-patterns/gate-commit-on-parallel-mutations-with-use-is-mutating-2026-05-11.md` — informs the future `Modal.Ok pending` decision.
- `compound-knowledge-db/docs/solutions/runtime-errors/react-infinite-rerender-unstable-context-callback-ref.md` — relevant when `useModalContext()` is introduced (Phase 1+); reminder that any function exposed in a context value must be stable (`useCallback` / dispatch).

### External

- [Radix Dialog primitive](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Radix AlertDialog primitive](https://www.radix-ui.com/primitives/docs/components/alert-dialog)
- [Radix Composition guide (asChild, Slot, Slottable)](https://www.radix-ui.com/primitives/docs/guides/composition)
- [Radix issue #3700 — `useId` hydration mismatch under React 19](https://github.com/radix-ui/primitives/issues/3700)
- [shadcn/ui issue #6988 — Body scroll lock leak](https://github.com/shadcn-ui/ui/issues/6988)
- [Radix issue #3007 — `aria-describedby` orphan id](https://github.com/radix-ui/primitives/issues/3007)
- [WAI-ARIA APG: Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WAI-ARIA APG: Alert Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)

---

## Appendix — Background research (from earlier deepening)

The following sections from the earlier deepened plan are preserved as background research. They informed the V1 scope decisions but are not operationally needed for Phase 0.

### Alternatives considered (summary)

- **Stay on `@floating-ui/react`, only refactor the API** — rejected: keeps maintenance burden of focus trap, a11y, alertdialog distinction internal.
- **HeadlessUI** — rejected: no `AlertDialog` distinct primitive; 30 destructive confirmations would not get proper `role="alertdialog"`.
- **React Aria Components (Adobe)** — rejected: best-in-class a11y but verbose API and more invasive integration.
- **Native HTML `<dialog>`** — rejected: no Portal automation, scroll lock manual, no `asChild` ergonomics.
- **shadcn/ui copy-in** — partially adopted: we use the *pattern* (Radix wrapped + DS-styled) without literal copy-paste.
- **Phase 1 adapter pattern (preserve all legacy props internally)** — rejected: more code than the new component itself, contradicts `feedback_no_deprecated_aliases`.

### System-wide impact highlights (preserved for Phase 2 scoping)

- **Open/close flow**: caller `setState(true)` → Radix `Dialog.Root` receives `open=true` → Portal mounts → Overlay + Content render with `data-state="open"` → `useId()` generates labelId/descriptionId → FocusScope auto-focuses → `inert` applied to siblings → body scroll-lock applies.
- **Close flow**: ESC / outside / Cancel button → Radix calls `onOpenChange(false)` → consumer setState → re-render with open=false → Content unmounts → FocusScope returns focus to trigger → scroll-lock removed.
- **Error / failure modes**: Radix dev error on missing Title, orphan `aria-describedby`, React 19 hydration mismatch (#3700), body scroll lock leak (#6988).
- **API surface parity**: `role="dialog"` preserved, `aria-labelledby` / `aria-describedby` improved, ESC + outside-click preserved (dismiss-configurable), focus trap improved (background `inert` now applied).
