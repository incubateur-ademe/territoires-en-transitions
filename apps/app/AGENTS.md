# apps/app — Frontend conventions

Next.js 16 (App Router) admin dashboard for collectivites's users.

## Layout

- **`apps/app/app/`** = Next.js App Router routes only. **`apps/app/src/`** = all feature code.
- **TypeScript alias `@/app/*` → `./src/*`.** It does NOT mean the App Router `app/` directory — a frequent footgun.
- Route groups: `app/(authed)/` wraps the user + collectivité providers; `app/(public)/` does not. Nested `(acces-restreint)/` enforces visitor-gate checks.
- `page.tsx` and `layout.tsx` are intentionally thin (server components by default). Delegate to a `*.view.tsx` in `src/` that carries `'use client'` if needed. Only ~17% of files are client components — keep it that way.
- `src/` is organised **by domain, not by file type**: `src/plans/`, `src/referentiels/`, `src/indicateurs/`, `src/collectivites/`, `src/users/`, `src/shared/`, `src/labels/`, `src/utils/`, `src/ui/`. Inside a feature folder, React Query hooks live in a `data/` subfolder.
- `src/` is organised as `domain/subdomain/feature/` with component-type file suffixes: `*.view.tsx`, `*.form.tsx`, `*.table.tsx`, etc (non-exhaustive).

## Data fetching & mutations

- Single canonical pattern: `const trpc = useTRPC()` then `useQuery(trpc.x.y.queryOptions(input, opts))` / `useMutation(trpc.x.y.mutationOptions(...))`.
- Types: `RouterInput<'x.y'>` / `RouterOutput<'x.y'>` from `@tet/api`.
- Current collectivité: `useCurrentCollectivite()` from `@tet/api/collectivites`.
- Cache keys: `trpc.x.y.queryKey(...)`. Cache invalidation: fan out `queryClient.invalidateQueries({ queryKey })` over every related list — see `src/plans/fiches/update-fiche/data/use-update-fiche.ts` for the canonical exemplar (with optimistic updates).

## Mutations & toasts

**Never call `toast.success(...)` / `toast.error(...)` inside a mutation.** A global subscriber listens to every mutation status change and renders the toast. Configure messages via React Query's `meta`:

```ts
useMutation(
  trpc.x.y.mutationOptions({
    meta: { success: 'Plan enregistré', error: "Échec de l'enregistrement" },
  })
);
```

`meta` accepts `success`, `error`, `disableToast`, `autoHideDuration`. Default fallbacks come from `appLabels.mutationSuccess` / `appLabels.mutationError`. See `src/utils/toast/use-mutation-toast.tsx` + `src/utils/react-query/use-mutation-cache-subscriber.tsx`.

## Forms

- `react-hook-form` + `zodResolver(schema)` with `mode: 'onChange'`.
- Zod schemas inline in the form file; reuse primitives from `@tet/domain/...` (e.g. `personneIdSchema`).
- Wrap every input in `<Field title hint state message>` from `@tet/ui` (handles label + error rendering). Inputs: `<Input>`, `<Select>`, `<VisibleWhen>` from `@tet/ui`. Custom controlled inputs use react-hook-form's `<Controller>`.
- `onSubmit` is async and returns `Promise<boolean>`; the form `reset()`s itself on truthy.
- Zod error messages are the documented exception to the "no inline French strings" rule.
- Exemplar: `src/plans/plans/upsert-plan/upsert-plan.form.tsx`.

## UI components

- **Default to `@tet/ui`** (workspace DS library). 400+ files use it: `Button`, `PageHeader`, `Field`, `Input`, `Select`, `VisibleWhen`, `EmptyCard`, `PictoWarning`, etc.
- **shadcn is not used.** Radix only via `@tet/ui`.
- Local primitives in `src/ui/` (buttons, charts, dropdownLists, layout, lists, Markdown, pictogrammes, icons, logo). Reach there when `@tet/ui` doesn't cover it.
- **Tailwind only.** No CSS modules. Tailwind config extends `@tet/ui/tailwind-preset` — DS tokens (`bg-grey-2`, `text-primary-9`, `bg-error-1`, `text-success`, `bg-warning-1`) are first-class. Don't introduce arbitrary hex.
- Class-merge with `cn` from `@tet/ui/utils/cn` (legacy `classnames` exists — use `cn` for new code).
- Page wrappers always use `<PageHeader>` with `<PageHeader.Title>` / `<PageHeader.Actions>` — never roll a custom `<h1>` header row.
- `data-test` attributes on interactive elements (dotted, context-prefixed — see root CLAUDE.md).

## State management

- **No Jotai. No Zustand.** Zero hits in `apps/app/src/`.
- Cross-component state = feature-local `*.context.tsx` exposing a `<FeatureProvider>` + a `useFeature()` hook that **throws** when used outside its provider. Exemplar: `src/plans/fiches/show-fiche/context/fiche-context.tsx`.
- URL state = `nuqs`. `NuqsAdapter` is wired in `app/root-providers.tsx`. Pages with filters/pagination use `useQueryStates` + `createSerializer` + `parseAsBoolean/parseAsInteger/parseAsJson/parseAsStringLiteral`, often with a short `urlKeys` map (`{ sortBy: '$s', currentPage: '$p' }`) to keep URLs readable.
- No SSR React Query prefetch — every page fetches client-side.

## Routing & layouts

- The whole app is `export const dynamic = 'force-dynamic'` (`app/layout.tsx`).
- Root provider stack (`app/root-providers.tsx`): `SupabaseProvider` → `UserProvider` → `PostHogProvider` → `TrpcWithReactQueryProvider` → `NuqsAdapter` → `ToastProvider`. Order matters; new providers slot here.
- Authed providers live in a separate client component `app/(authed)/authed-providers.tsx`, fed by the server `app/(authed)/layout.tsx` (which fetches `getUser()`). Mirror this server-layout + client-provider split for any new authed surface.
- Collectivité param parsed with `z.coerce.number()` in the layout.
- **Never hand-concatenate URLs** — use builders in `src/app/paths.ts` (`makeCollectiviteToutesLesFichesUrl(...)` etc.).

## Auth & permissions

- Client components: `useUser()` from `@tet/api/users` (throws if unauthenticated), `useCurrentCollectivite()` / `useCollectiviteId()` from `@tet/api/collectivites`.
- Server components: `getUser()` from `@tet/api/users/user-details.fetch.server`, then `hasPermission(user, '...')` / `hasRole(user, PlatformRole.VERIFIED)` from `@tet/domain/users`.
- Permission check in UI: `useCurrentCollectivite().hasCollectivitePermission('plans.fiches.read')`.
- Do not use `isVisitor()` directly, derive more precise access restrictions from `hasCollectivitePermission()` instead.

## Copy & i18n

The app is **French-only**. `<html lang="fr" translate="no">` is set in the root layout.

`src/labels/catalog.ts` is the **only public entry point** (`appLabels`). It spreads domain files:

| File                                | Content                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `shared.labels.ts`                  | Generic actions (`valider`, `ajouter`…), filters, thématiques |
| `collectivites.labels.ts`           | Collectivité, rejoindre un espace                             |
| `referentiels.labels.ts`            | Référentiels, mesures, audits, documents                      |
| `utilisateurs-and-entity.labels.ts` | Roles, personnes pilotes / élues, services, invitations       |
| `plans.labels.ts`                   | Plans, actions (fiches), filters, budgets                     |
| `indicateurs.labels.ts`             | Indicateurs                                                   |

UI code always `import { appLabels } from '@/app/labels/catalog'`. Do not import domain files from components. Local maps (`filters/labels.ts`, `acteurs/labels.ts`) are fine if they only point at `appLabels`. `@tet/ui` has its own catalog — do not mix the two.

### 1. No inline French in components

Buttons, placeholders, titles, tooltips, toast `meta` and visible copy go through `appLabels`. Inline French in existing components is tech debt. **Exception:** Zod error messages.

ESLint: `react/jsx-no-literals` (error) blocks string children in JSX. `tet/no-hardcoded-ui-copy` (warn) flags string literals on UI props (`title`, `label`, `placeholder`, `hint`, `message`, `description`, `alt`, `aria-label` / `ariaLabel`, `tooltip`, `tooltipLabel`, `emptyTitle`, `emptyDescription`, `closeLabel`, `legend`) and on `meta.success` / `meta.error`. Off for `src/labels/**`, stories, fixtures, and specs. CI uses `--quiet`, so warnings do not fail the pipeline.

### 2. New strings go in the domain file, not `catalog.ts`

Do not add new keys to `catalog.ts` unless they truly have no domain. Check for an existing key first (`valider`, `personnePilote`, `indicateur`…). `catalog.ts` still holds leftover keys (démarches, labellisation, toasts…) — extract them with the recipe below rather than growing it.

### 3. Key families share a prefix

camelCase. Domain terms stay in French (`fiche`, `mesure`, `collectivite`). Interpolation = typed function.

```ts
personnePilote: plural({ one: 'Personne pilote', other: 'Personnes pilotes' }),
personnePiloteSans: 'Sans personne pilote',
personnePiloteAjouter: 'Ajouter une personne pilote',
personnePiloteSelectOrCreatePlaceholder: (isEditionAllowed: boolean) =>
  `Sélectionner ${isEditionAllowed ? 'ou créer ' : ''}une personne pilote`,
```

If a select can create an option, pass `isEditionAllowed` instead of two nearly identical keys.

### 4. Pluralisation: only `plural` from `@tet/ui/labels/plural`

`countedPlural` is gone.

```ts
indicateur: plural({
  one: 'indicateur',
  other: 'indicateurs',
  // zero: 'Aucun indicateur', // optional, returned as-is for count === 0
}),
```

| Call                                                     | Result            |
| -------------------------------------------------------- | ----------------- |
| `appLabels.indicateur()`                                 | `"indicateur"`    |
| `appLabels.indicateur({ plural: true })`                 | `"indicateurs"`   |
| `appLabels.indicateur({ count: 3 })`                     | `"3 indicateurs"` |
| `appLabels.indicateur({ count: 3, withoutCount: true })` | `"indicateurs"`   |

Titles that need a capital: `capitalize` from the same module — `capitalize(appLabels.personnePilote({ plural: true }))`.

### Extracting a leftover string

1. Find the hardcoded French (or the key still sitting in `catalog.ts`).
2. Search the `*.labels.ts` files for an existing key.
3. If none, add it to the right domain file, with `plural` when it inflects.
4. Replace usages in the component, unit tests, and e2e POMs.
5. Do not duplicate the key in `catalog.ts` — the spread already exposes it.

## Testing

- Vitest config: `apps/app/vitest.config.mts` (jsdom; picks up both `src/**` and `app/**` matching `{test,spec}.{ts,tsx}`).
- **No MSW. No custom `renderWithProviders` helper.** Components using tRPC/React-Query are not unit-tested; prefer pure leaf components and pure-logic specs.
- React Testing Library (`render`, `screen`, `within`, `fireEvent`) + `vi.fn()` from `vitest`. Assert by accessible role/label in French: `getByRole('group', { name: AUDIT_TYPE_LEGEND })`.
- Most "frontend" specs are non-DOM pure-logic tests next to utils/hooks. Component `.spec.tsx` is the exception.
- Storybook (`*.stories.tsx`) coexists but isn't in CI tests; excluded from `tsconfig.project.json`.
- Exemplar: `src/referentiels/labellisations/start-audit/start-audit.form.spec.tsx`.

## Analytics

- Use `useEventTracker()` + `Event` enum from `@tet/ui` — `tracker(Event.updateFiltres, { ... })`. Don't call PostHog directly.

## Notable utilities

- `src/labels/catalog.ts` — public `appLabels` entry (spreads `*.labels.ts` domain files).
- `src/app/paths.ts` — URL builders.
- `src/utils/toast/` — toast context + mutation subscriber.
- `src/utils/error/error.page.tsx` + `error.card.tsx` — error UI + Sentry capture (handles `TRPCClientErrorLike`).
- `src/utils/formatUtils.ts`, `to-locale-fixed.ts`, `to-percent-string.ts`, `naturalSort.ts` — prefer these over ad-hoc `Intl.NumberFormat`.
- `es-toolkit` (`pick`, `omit`, `without`) — the chosen utility lib. **Don't add lodash.**
