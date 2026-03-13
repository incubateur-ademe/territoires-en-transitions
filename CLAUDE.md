# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Territoires en Transitions** — a government digital platform (ADEME / beta.gouv.fr) helping French local governments track ecological transition actions (CAE/Cit'ergie and ECI referentials). Manages action plans, indicators, audits, and scoring.

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

# Single test file or pattern (backend)
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

Data flows: Frontend (`useQuery`/`useMutation`) → tRPC Router → Application Service → Repository (Drizzle ORM) → PostgreSQL (Supabase).

## Naming & File Conventions (ADR 0003)

- **Files and folders**: `kebab-case`
- **Language**: business domain names/entities in **French**, all code/technical constructs in **English**
- **File suffix indicates type**: `fiche-action.table.ts`, `fiche-action.dto.ts`, `list-fiches.service.ts`, `list-fiches.router.ts`
- **Actions start with a verb**: `list-mesures.service.ts` / `class ListMesuresService` / `use-list-mesures.ts`
- Preferred verbs: `get`, `list`, `upsert`, `create`, `delete`, `add`, `remove`, `send`, `receive`, `validate`, `calculate`, `build`, `toggle`, `is/has/can`
- `data-test` attributes prefixed with context: `data-test="referentiels.snapshots.figer-referentiel-button"`

### Domain structure (fixed — don't add new domains without team validation)

`users` / `collectivites` (membres, personnalisations, documents) / `referentiels` (définitions, scores, labellisations) / `indicateurs` (trajectoires) / `plans` (plans, fiches, paniers, modeles) / `shared`

## Backend Architecture (ADR 0011 — DDD)

Organize as `domain/subdomain/feature/` with responsibility-specific file suffixes:

```
plans/fiches/mutate-fiche/
  mutate-fiche.input.ts        # Zod input schema
  mutate-fiche.output.ts       # Zod output schema
  mutate-fiche.service.ts      # Application service (orchestration)
  mutate-fiche.router.ts       # tRPC router
  mutate-fiche.router.e2e-spec.ts  # E2E tests (preferred test approach)
  mutate-fiche.repository.ts   # DB access via Drizzle ORM
  mutate-fiche.adapter.ts      # DB ↔ domain transformation
  mutate-fiche.rule.ts         # Pure business logic (no external deps)
  mutate-fiche.error.ts        # Typed domain errors
  mutate-fiche.effect.ts       # Side effects
```

For complex workflows, split into Application Service (authorization + coordination + side effects) and Domain Service(s) (business rules + persistence).

Keep services under ~300 lines. Extract layers only when complexity justifies it — a simple service can keep everything in one file.

## Result Pattern (ADR 0012)

Public service methods return `Result<T, E>` instead of throwing:

```typescript
type Result<T, E> = { success: true; value: T } | { success: false; error: E };
```

Use `success(value)` / `failure(error)` helpers. Use `createTrpcErrorHandler` in routers to convert internal errors to `TRPCError`. Use `TransactionManager` (`@tet/backend/utils/transaction/transaction-manager.service`) for transactions — pass `tx` down to repositories to share a transaction across services.

## Testing

- Tests are **colocated** with source files.
- Backend: prefer `router.e2e-spec.ts` (full NestJS app + real DB) over unit tests with mocks.
- Use `getTestRouter()` from `apps/backend/test/app-utils.ts` and `getAuthUser()` from `test/auth-utils.ts`.
- Frontend: Vitest + jsdom environment.
- DB tests: pgTAP in `data_layer/tests/`.
