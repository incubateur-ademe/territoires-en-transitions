import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { FEATURE_FLAGS } from '@tet/domain/utils';
import z from 'zod';
import { TrackingService } from './tracking.service';

const listFeatureFlagsInputSchema = z.object({
  collectiviteId: z.number().int().positive().optional(),
});

const listFeatureFlagsOutputSchema = z.record(
  z.enum(FEATURE_FLAGS),
  z.boolean()
);

@Injectable()
export class ListFeatureFlagsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly trackingService: TrackingService
  ) {}

  router = this.trpc.router({
    /**
     * Flags de l'application pour l'utilisateur, et pour la collectivité
     * consultée si elle est donnée (groupe PostHog `collectivite`).
     *
     * Pas de contrôle d'appartenance à la collectivité : ses pages se
     * consultent aussi en visite, et la réponse ne contient que des
     * booléens d'activation.
     */
    list: this.trpc.authedProcedure
      .input(listFeatureFlagsInputSchema)
      .output(listFeatureFlagsOutputSchema)
      .query(({ input, ctx: { user } }) =>
        this.trackingService.listFeatureFlags(input, { user })
      ),
  });
}
