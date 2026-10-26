# apps/prototypes — Design prototypes

Next.js app where design prototypes are built with the real design system, so a
prototype can be transposed as-is into `apps/app`. No backend, no auth, no data
fetching: pages render local fixtures.

## Workflow

- Run: `nx dev prototypes` (port 3002, `PROTOTYPES_PORT` to override).
- One prototype = one route: `app/<slug>/page.tsx`, plus an entry in
  `src/prototypes.ts` so it appears on the home page.
- Every page starts with `'use client'`: `@tet/ui` compound components
  (`PageHeader.Title`, `PageHeader.Actions`…) don't render from a server
  component.
- `nx lint prototypes` must pass before sharing a prototype.

## Compose only with `@tet/ui`

- Import from `@tet/ui` only. Read `packages/ui/src/design-system/` and its
  stories to find a component and its variants before writing anything.
- Never copy a design system component's code, never import from
  `@tet/ui/src/...`, never pull another UI library (Radix, MUI, shadcn, icon
  packs…). The lint blocks these.
- The page frame (header, page container, footer) comes from `AppShell` in
  `app/layout.tsx`: don't rebuild it.

## Layout: primitives only

All layout goes through `Stack`, `Inline`, `Grid` and `Box` from `@tet/ui`.
The parent owns the spacing: no margins on children.

| Need                             | Write                                        |
| -------------------------------- | -------------------------------------------- |
| Vertical list of blocks          | `<Stack gap="md">`                           |
| Row of items, wraps              | `<Inline gap="sm" align="center">`           |
| Title left, actions right        | `<Inline justify="between" align="center">`  |
| Row on desktop, column on mobile | `<Inline collapseBelow="md">`                |
| Columns                          | `<Grid columns={{ base: 1, md: 2, lg: 3 }}>` |
| Padding around content           | `<Box padding="lg">`                         |

- Spacing scale: `none` 0 · `xs` 4px · `sm` 8px · `md` 16px · `lg` 24px ·
  `xl` 32px. Every prop accepts per-breakpoint values:
  `gap={{ base: 'sm', lg: 'md' }}`.
- Use `as` for semantics: `<Grid as="ul">` + `<Box as="li">`, `<Stack as="section">`.
- `className` is for everything else (text, colors, borders, radius) with preset
  tokens only (`text-primary-9`, `bg-grey-1`, `border-grey-3`…).
- Forbidden in `className` (lint error): `flex`, `grid`, `gap-*`, `space-*`,
  `p*-*`, `m*-*`, `items-*`, `justify-*`, `grid-cols-*`, and any arbitrary
  value (`w-[13px]`, `text-[#123456]`). Resetting a margin to zero (`mb-0` on
  a heading) is allowed. No layout properties in `style` either.

## When the design system doesn't cover it: `proposals/`

A missing component, a new variant, or a spacing outside the scale is a design
system decision, not a local workaround. Put it in a `proposals/` folder next to
the page, one file per proposal, starting with:

```tsx
/**
 * Proposition : variante de `Button` | nouveau composant
 * Besoin : <why the design system doesn't cover it>
 */
```

The lint only warns inside `proposals/`, so every proposal shows up in review.
Keep proposals small and keep the page itself free of hand-written layout.

## Data

Fixtures live in the page file or in a `fixtures.ts` next to it, as `ReadonlyArray`
of `Readonly` objects. Keep domain names in French (`plan`, `fiche`,
`collectivite`), as in the rest of the repo.
