import { Injectable } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { SearchRequestSchema, SearchResponseSchema } from '@tet/domain/search';
import { TRPCError } from '@trpc/server';
import { SearchAdminRouter } from './search-admin.router';
import { SearchService } from './search.service';

/**
 * Per-user rate limit applied to `search.query`.
 *
 * Plan U7 mandates 60 req / 60 s per user. We keep the values as constants so
 * tests can assert the exact thresholds and so the values can be lifted into
 * config later without churning the router shape.
 */
export const SEARCH_RATE_LIMIT_REQUESTS = 60;
export const SEARCH_RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * Read-side proxy router for the global ⌘K search (U7).
 *
 * The `@Throttle({ default: { limit: 60, ttl: 60000 } })` class decorator is
 * kept as documentation of the intended budget and so a future migration to
 * NestJS-controller-mounted endpoints picks it up automatically. The actual
 * enforcement on the tRPC path goes through `rateLimitMiddleware` below — the
 * `@nestjs/throttler` `ThrottlerGuard` registered as `APP_GUARD` only fires on
 * NestJS controllers, and tRPC procedures are mounted as plain Express
 * middleware (see `TrpcRouter.applyMiddleware`).
 */
@Throttle({
  default: { limit: SEARCH_RATE_LIMIT_REQUESTS, ttl: SEARCH_RATE_LIMIT_WINDOW_MS },
})
@Injectable()
export class SearchRouter {
  /**
   * In-process sliding-window rate limiter. Keyed by `user.id` (an
   * authenticated user is guaranteed by `authedProcedure`). Single-instance
   * scope is acceptable for v1 — a Redis-backed limiter would only be needed
   * once we run the API under multiple replicas behind a single user pool.
   *
   * Each entry is the array of millisecond timestamps of the last N requests;
   * we drop entries older than the window before each check.
   */
  private readonly rateLimitBuckets = new Map<string, number[]>();

  constructor(
    private readonly trpc: TrpcService,
    private readonly searchService: SearchService,
    private readonly searchAdminRouter: SearchAdminRouter
  ) {}

  /**
   * tRPC middleware that enforces the per-user rate limit. Throws
   * `TOO_MANY_REQUESTS` once the user has spent more than
   * `SEARCH_RATE_LIMIT_REQUESTS` calls within `SEARCH_RATE_LIMIT_WINDOW_MS`.
   */
  private rateLimitMiddleware = this.trpc.trpc.middleware(
    async ({ ctx, next }) => {
      const userId = ctx.user?.id;
      // `authedProcedure` already rejected anonymous users; this is
      // belt-and-braces typing.
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const now = Date.now();
      const windowStart = now - SEARCH_RATE_LIMIT_WINDOW_MS;
      const existing = this.rateLimitBuckets.get(userId) ?? [];
      // Trim entries that fell out of the window. `findIndex` here is O(n)
      // but n is bounded by SEARCH_RATE_LIMIT_REQUESTS so the cost is fine.
      const fresh = existing.filter((ts) => ts > windowStart);
      if (fresh.length >= SEARCH_RATE_LIMIT_REQUESTS) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Trop de requêtes, réessayez dans une minute',
        });
      }
      fresh.push(now);
      this.rateLimitBuckets.set(userId, fresh);

      return next({ ctx });
    }
  );

  router = this.trpc.router({
    query: this.trpc.authedProcedure
      .use(this.rateLimitMiddleware)
      .input(SearchRequestSchema)
      .output(SearchResponseSchema)
      .query(async ({ ctx, input }) => {
        // `authedProcedure` guarantees a non-null user; the explicit middleware
        // we chained above (`rateLimitMiddleware`) widens the inferred type
        // back to `AuthUser | null`, hence the assertion. The middleware also
        // throws `UNAUTHORIZED` defensively if the user is somehow missing.
        return this.searchService.search(ctx.user!, input);
      }),
    /**
     * Sous-routeur admin (U8) — exposé sous la clé `admin` pour respecter le
     * chemin attendu par le frontend (`search.admin.reindexPlans`, etc.).
     * Le gating plateforme est appliqué dans `SearchAdminService.reindex`,
     * pas ici.
     */
    admin: this.searchAdminRouter.router,
  });
}
