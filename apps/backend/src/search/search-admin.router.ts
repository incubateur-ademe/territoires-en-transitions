import { Injectable } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { SearchAdminService } from './search-admin.service';

/**
 * Limite de débit par utilisateur pour les procédures admin de réindexation
 * (U8). 5 req/min : ces endpoints sont à très faible fréquence (déclenchés
 * manuellement par un opérateur), un budget plus généreux n'a pas de sens et
 * ouvrirait une porte à un déni de service via réindexation répétée.
 */
export const SEARCH_ADMIN_RATE_LIMIT_REQUESTS = 5;
export const SEARCH_ADMIN_RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * Schéma d'entrée commun aux 5 procédures : un seul paramètre `mode`. Par
 * défaut `upsert` — c'est le mode sûr sous trafic.
 */
const reindexInputSchema = z.object({
  mode: z.enum(['upsert', 'rebuild']).default('upsert'),
});

const reindexOutputSchema = z.object({
  indexedCount: z.number(),
  durationMs: z.number(),
  mode: z.string(),
});

/**
 * Router admin pour la réindexation Meilisearch (U8).
 *
 * Cinq procédures, une par index : `reindexPlans`, `reindexFiches`,
 * `reindexIndicateurs`, `reindexActions`, `reindexDocuments`. Toutes
 * prennent le même schéma d'entrée (`{ mode }`) et renvoient le même
 * schéma de sortie (`{ indexedCount, durationMs, mode }`).
 *
 * Le gating plateforme (`COLLECTIVITES.MUTATE` × `ResourceType.PLATEFORME`)
 * est appliqué dans `SearchAdminService.reindex` — pas ici. La granularité
 * `authedProcedure` reste suffisante côté router : un user non-authentifié
 * ne peut même pas appeler la procédure ; un user authentifié non-admin
 * passe l'auth tRPC mais reçoit `FORBIDDEN` dans le service.
 *
 * Le décorateur `@Throttle` est appliqué pour mémoire / future migration
 * vers un controller NestJS — l'enforcement effectif sur le chemin tRPC
 * passerait par un middleware similaire à `SearchRouter.rateLimitMiddleware`
 * (cf. U7). On n'en pose PAS ici en v1 : le volume admin est négligeable
 * (<5 req/min/user en pratique opérationnelle).
 */
@Throttle({
  default: {
    limit: SEARCH_ADMIN_RATE_LIMIT_REQUESTS,
    ttl: SEARCH_ADMIN_RATE_LIMIT_WINDOW_MS,
  },
})
@Injectable()
export class SearchAdminRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly searchAdminService: SearchAdminService
  ) {}

  router = this.trpc.router({
    reindexPlans: this.trpc.authedOrServiceRoleProcedure
      .input(reindexInputSchema)
      .output(reindexOutputSchema)
      .mutation(async ({ ctx, input }) => {
        return this.searchAdminService.reindex(ctx.user!, 'plans', input.mode);
      }),

    reindexFiches: this.trpc.authedOrServiceRoleProcedure
      .input(reindexInputSchema)
      .output(reindexOutputSchema)
      .mutation(async ({ ctx, input }) => {
        return this.searchAdminService.reindex(ctx.user!, 'fiches', input.mode);
      }),

    reindexIndicateurs: this.trpc.authedOrServiceRoleProcedure
      .input(reindexInputSchema)
      .output(reindexOutputSchema)
      .mutation(async ({ ctx, input }) => {
        return this.searchAdminService.reindex(
          ctx.user!,
          'indicateurs',
          input.mode
        );
      }),

    reindexActions: this.trpc.authedOrServiceRoleProcedure
      .input(reindexInputSchema)
      .output(reindexOutputSchema)
      .mutation(async ({ ctx, input }) => {
        return this.searchAdminService.reindex(
          ctx.user!,
          'actions',
          input.mode
        );
      }),

    reindexDocuments: this.trpc.authedOrServiceRoleProcedure
      .input(reindexInputSchema)
      .output(reindexOutputSchema)
      .mutation(async ({ ctx, input }) => {
        return this.searchAdminService.reindex(
          ctx.user!,
          'documents',
          input.mode
        );
      }),
  });
}
