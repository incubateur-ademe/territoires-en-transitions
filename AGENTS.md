# CLAUDE.md

For side-specific conventions, see:
- `@apps/app/CLAUDE.md` — frontend (Next.js 16 + tRPC client + DSFR)
- `@apps/backend/CLAUDE.md` — backend (NestJS 11 + tRPC + Drizzle)

## Project Overview

**Territoires en Transitions** — a government digital platform (ADEME / beta.gouv.fr) helping French local governments track ecological transition actions (CAE/ECI/TE referentials). Manages action plans, indicators, audits, and scoring.

## Commands

```bash
# Development
pnpm dev              # All apps in parallel
pnpm dev:app          # app + auth + backend
pnpm dev:backend      # Backend only

# Testing
pnpm test:app         # Frontend tests (Vitest + jsdom)
pnpm test:api         # API / domain tests
pnpm test:backend     # Backend tests (Vitest + NestJS)

# Single backend test file or name pattern
nx test backend 'filename.spec.ts'
nx test backend 'referentiels'

# Database (uses act / GitHub Actions locally)
act -j db-init        # Init DB with migrations + seed data
act -j db-restore     # Restore to seed state
```

## Architecture

Nx monorepo with pnpm. Key workspaces:

- **`apps/backend`** — NestJS API server. Exposes tRPC routers and REST controllers.
- **`apps/app`** — Next.js 16 main frontend (admin dashboard).
- **`apps/auth`** — Authentication service (Next.js).
- **`apps/site`** — Public marketing site.
- **`packages/api`** — Shared API types between frontend and backend.
- **`packages/domain`** — Shared business entities and pure rules.
- **`packages/ui`** — Shared React component library (DSFR design system).
- **`data_layer/sqitch`** — PostgreSQL migrations via Sqitch.
- **`data_layer/tests`** — pgTAP database unit tests.

Data flow: Frontend (`useQuery`/`useMutation`) → tRPC Router → Application Service → Repository (Drizzle ORM) → PostgreSQL (Supabase).

## Naming & File Conventions (ADR 0003)

- **Files and folders**: `kebab-case`.
- **Language**: business domain names/entities in **French**, all code/technical constructs in **English**. Never anglicise a domain term (`fiche` stays `fiche`, not `record`).
- **File suffix indicates type**: `fiche-action.table.ts`, `fiche-action.dto.ts`, `list-fiches.service.ts`, `list-fiches.router.ts`.
- **Actions start with a verb**: `list-mesures.service.ts` / `class ListMesuresService` / `use-list-mesures.ts`.
- Preferred verbs: `get`, `list`, `upsert`, `create`, `delete`, `add`, `remove`, `send`, `receive`, `validate`, `calculate`, `build`, `toggle`, `is/has/can`.
- `data-test` attributes prefixed with context: `data-test="referentiels.snapshots.figer-referentiel-button"`.

### Domain structure (fixed — don't add new domains without team validation)

`users` / `collectivites` (membres, personnalisations, documents) / `referentiels` (définitions, scores, labellisations) / `indicateurs` (trajectoires) / `plans` (plans, fiches, paniers, modeles) / `shared`.

## Testing (cross-cutting)

- Tests are **colocated** with source files.
- DB tests: pgTAP in `data_layer/tests/`.

## Whole-repo gotchas

- Domain names stay in French in code (`fiche`, `mesure`, `collectivite`, `referentiel`). Don't translate them.
- Files prefixed `[deprecated]` or `DEPRECATED_…` are tech debt — never copy patterns from them.
- Personal Claude overrides go in `./.claude.local.md` (gitignored), not in this file.
