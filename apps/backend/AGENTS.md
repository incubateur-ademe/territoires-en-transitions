# apps/backend — Backend conventions

NestJS 11 + tRPC + Drizzle + BullMQ.

## DDD layout (ADR 0011)

Organise as `domain/subdomain/feature/` with responsibility-specific file suffixes:

```
plans/fiches/mutate-fiche/
  mutate-fiche.input.ts            # Zod input schema
  mutate-fiche.output.ts           # Zod output schema
  mutate-fiche.service.ts          # Application service (orchestration)
  mutate-fiche.router.ts           # tRPC router
  mutate-fiche.router.e2e-spec.ts  # E2E tests (preferred test approach)
  mutate-fiche.repository.ts       # DB access via Drizzle ORM
  mutate-fiche.adapter.ts          # DB ↔ domain transformation
  mutate-fiche.rules.ts            # Pure business logic (no external deps)
  mutate-fiche.errors.ts           # Typed domain errors (PLURAL — de-facto convention)
  mutate-fiche.worker.ts           # Queue worker (BullMQ)
```

- Keep services under ~300 lines. For complex workflows, split into Application Service (authorization + coordination + side effects) and Domain Service(s) (business rules + persistence).

## Result pattern (ADR 0012)

Public service methods return `Result<Data, E>` instead of throwing:

```ts
type Result<Data, ServiceError, Cause extends Error = Error> =
  | { success: true; data: Data }
  | { success: false; error: ServiceError; cause?: Cause };
```

- Helpers: `success(data)`, `failure(error, cause?)`, `isSuccess`, `isFailure`, `combineResults` — from `apps/backend/src/utils/result.type.ts`.
- Routers convert Result → TRPCError with `private readonly getResultDataOrThrowError = createTrpcErrorHandler(<feature>ErrorConfig)` (stored on the class, not invoked inline).
- REST `@Controller` classes use `createControllerErrorHandler` instead (maps TRPC codes to `HttpException`s) — `apps/backend/src/utils/nest/controller-error-handler.ts`.

## tRPC routers as NestJS providers

- Every router is an `@Injectable()` class that holds a `router` property built with `this.trpc.router({...})`.
- Domain routers inject and compose sub-routers (`PlanMainRouter` → `UpsertPlanRouter`, `FicheActionBudgetRouter`, …).
- Root composition: `apps/backend/src/utils/trpc/trpc.router.ts` — `AppRouter` is exported as `TrpcRouter['appRouter']`.
- To add a feature router: create the `@Injectable()` class, expose `router`, then wire it into the parent domain router (NOT directly into the root).

## Auth = procedure choice

Pick the procedure factory from `TrpcService` and you're done — **there is no `@UseGuards` and no per-route auth middleware**:

- `publicProcedure` — anyone.
- `anonProcedure` — explicit anonymous.
- `authedProcedure` — requires `AuthenticatedUser`.
- `authedOrServiceRoleProcedure` — user OR service role JWT.
- `serviceRoleProcedure` — service role only (internal endpoints called by external schedulers, should be avoided if possible).

Auth context (`TrpcService.createContext`) prefers the Supabase cookie (`extractAccessTokenFromSupabaseCookie`), with `Authorization: Bearer …` as fallback.

## Services & authorization

- **Services always take context `{ user: AuthenticatedUser, isUserTrusted?: boolean, tx?: Transaction }` as last parameter.** – `apps/backend/src/utils/nest/service-second-arg.utils.ts`. Never read `ctx` inside a service.
- Services always return `Result<T,E>` (see `apps/backend/src/utils/result.type.ts`).
- Generic permission check: `permissionService.isAllowed(user, op, ResourceType, resourceId, doNotThrow?, tx?)` — `apps/backend/src/users/authorizations/permission.service.ts`. Operations are typed strings from `@tet/domain/users` (`PLANS.FICHES.CREATE`, `PLANS.MUTATE`, …).
- Services returns `Result<T,E>` thus MUST pass `doNotThrow=true` and convert to `failure('UNAUTHORIZED')` themselves. 
- Fiche-scoped reads/writes: prefer `FicheActionPermissionsService.canReadFiche` / `canWriteFiche` / `canDeleteFiche` — handles fiche sharing, parent-pilote inheritance, and read-restreint logic.
- Multi-step orchestrations: thread an authorization-token object (e.g. `FicheCreateAuthorization.forCollectivite(...)`) rather than re-checking at every layer.

## IDOR rule (recurring — commit `04201725c`)

For any UPDATE/DELETE whose payload carries both an `id` and a parent ID (`collectiviteId`, `ficheId`, …):

1. **WHERE must include the parent ID** alongside `id`: `WHERE id = ? AND collectiviteId = ?`.
2. **SET must NOT include the parent ID** — strip it from the payload before update.
3. **Authorize against the resource's stored parent ID**, not the one in the input.

Reference: `apps/backend/src/plans/axes/upsert-axe/upsert-axe-base.repository.ts:84-103` ("on n'accepte pas le `collectiviteId` du payload comme cible de l'update").

## Transactions

- `TransactionManager` at `apps/backend/src/utils/transaction/transaction-manager.service.ts`. Use `transactionManager.executeSingle(async (tx) => { ... })` for a fresh transaction.
- **Every repository write accepts an optional `tx?: Transaction` as the LAST parameter** and uses `(tx ?? this.databaseService.db)`.
- Thread the same `tx` across services for atomic multi-step writes. Exemplar: `apps/backend/src/plans/paniers/checkout/checkout.service.ts:54-90`.
- `Transaction` type is derived from `DatabaseService['transaction']` (see `apps/backend/src/utils/database/transaction.utils.ts`), not `PgTransaction` directly.

## Drizzle / DB boundary

- Services may call `databaseService.db` directly for simple one-shot queries. The repository pattern is reserved for shared base classes (`UpsertAxeBaseRepository`), `tx`-aware writes, or larger query surfaces.
- Raw `sql\`\`` is allowed. Use `sql.identifier()` for table/column names. Use `sql.raw()` ONLY for already-validated trusted values.
- `buildConflictUpdateColumns(table, columns)` from `apps/backend/src/utils/database/conflict.utils.ts` for `.onConflictDoUpdate({...})`.

## Errors

String-enum + config-map pattern (no class hierarchy):

```ts
const specificErrors = ['UPSERT_X_ERROR', 'NOT_FOUND_X'] as const;
type XSpecificError = (typeof specificErrors)[number];

export const xErrorConfig: TrpcErrorHandlerConfig<XSpecificError> = {
  specificErrors: { UPSERT_X_ERROR: { code: 'INTERNAL_SERVER_ERROR', message: '…' }, ... },
};
export const XErrorEnum = createErrorsEnum(specificErrors); // merges COMMON errors
export type XError = keyof typeof XErrorEnum;
```

Common errors (`SERVER_ERROR`, `UNAUTHORIZED → FORBIDDEN`, `DATABASE_ERROR`, `NOT_FOUND`) come from `apps/backend/src/utils/trpc/common-errors.ts` — already mixed in by `createErrorsEnum`.

## Logging & context

- `private readonly logger = new Logger(<ClassName>.name)` — **never `console.log`**.
- Every log line auto-attaches `correlationId`, `userId`, `authRole`, `collectiviteId`, `referentielId`, `requestPath`, `trace_id` via AsyncLocalStorage — you don't pass them manually.
- **Key naming matters for log enrichment:** for `collectiviteId` / `referentielId` to surface in logs, the Zod input field must be named exactly that (constants in `collectivites/collectivite-api.constants.ts` and `referentiels/models/referentiel-api.constants.ts`).
- Errors auto-forward to Sentry via `AllExceptionsFilter` and the tRPC `onError` hook (UNAUTHORIZED is filtered out).

## Side effects

- **Emails:** `EmailService.sendEmail(...)` at `apps/backend/src/utils/email/email.service.ts`. Returns a custom Result with `{ messageId, status: 'pending'|'rejected'|'unknown'|'not-whitelisted', errorMessage }`. React Email templates colocated as `*.email.tsx`. Whitelist enforced via `SMTP_TO_EMAIL_WHITELIST` env var.
- **Notifications:** `NotificationsService.createPendingNotification(...)`. Content generators register at construction time via `notificationsService.registerContentGenerator(NotifiedOnEnum.X, ...)`. **No Nest event bus.**
- **Storage:** `SupabaseService.saveInStorage({ bucket, path, file, mimeType })` at `apps/backend/src/utils/database/supabase.service.ts` (not `utils/supabase/`).
- **Queues:** BullMQ via `@nestjs/bullmq`. `*.queue.ts` declares the queue + options; `*.worker.ts` extends `WorkerHost` with `@Processor(QUEUE_NAME, { lockDuration, concurrency, maxStalledCount })`. Vitest uses a per-process prefix to isolate parallel runs.
- **CRON: there is no `@nestjs/schedule`.** Recurring tasks are `serviceRoleProcedure` mutations called by an external scheduler. Choose: external schedule → `serviceRoleProcedure` mutation; in-process async → BullMQ.

## Configuration

- `ConfigurationService.get('VAR_NAME')` only — **never `process.env.X`**.
- Single Zod schema at `apps/backend/src/utils/config/configuration.model.ts`. Required boot vars: `z.string().min(1)`. Optional/feature-flag-y: `z.string().optional()` with a comment explaining why (mirror the `GOOGLE_API_KEY` / `GEMINI_MODEL` style).
- Numeric vars: `z.coerce.number().int().positive().prefault(default)`.
- Production sets `ignoreEnvFile: true` — env comes from the deployment platform.

## Testing

- Prefer `*.router.e2e-spec.ts` (full NestJS app + real DB) over unit tests with mocks.
- Setup pattern:

  ```ts
  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    const { collectivite, user } = await addTestCollectiviteAndUser(databaseService, { user: { role: CollectiviteRole.ADMIN } });
    authenticatedUser = getAuthUserFromUserCredentials(user);

    return async () => {
      await app.close();
    };
  });
  ```

- Build callers with `router.createCaller({ user: authenticatedUser })`.
- **Use `getAuthUserFromUserCredentials(user)` (fast, synchronous).** `getAuthUser()` round-trips Supabase signInWithPassword — slow; avoid unless you genuinely need a real session.
- Always use fresh collectivité and user fixtures (do not use seeded `collectiviteId: 1`): `addTestCollectiviteAndUser(db, ...)` from `collectivites/collectivites/collectivites.test-fixture.ts`. Search `*.test-fixture.ts` for per-domain fixtures.
- With fresh fixtures, no need to cleanup. If you need to cleanup, use Vitest's `onTestFinished(async () => { ... })` rather than `afterEach`.

## Things that bite newcomers

- `Result.data` (not `Result.value`).
- File suffix is `.errors.ts` (plural).
- `.effect.ts` does not exist — put side effects in `.service.ts` / `.email.tsx` / `.worker.ts`.
- `authedProcedure` IS the auth check — there is no separate guard.
- Services receive `user` as a parameter; don't read `ctx` inside services.
- Drop the parent ID (`collectiviteId`, `ficheId`, …) from any SET clause; include it in WHERE.
- `permissionService.isAllowed(..., doNotThrow=true, tx?)` for Result-returning services.
- No `@nestjs/schedule` — use `serviceRoleProcedure` for cron, BullMQ for in-process queues.
- `getAuthUserFromUserCredentials` is fast; `getAuthUser` is slow.
