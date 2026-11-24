import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { toSnapshotWithoutPayloads } from '@tet/backend/referentiels/snapshots/snapshot-without-payloads.utils';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { setScoreFromIndicateurErrorConfig } from './set-score-from-indicateur.errors';
import {
  setIndicateurSuiviInputSchema,
  setScoreFromIndicateurInputSchema,
} from './set-score-from-indicateur.input';
import { SetScoreFromIndicateurService } from './set-score-from-indicateur.service';
import { RefreshStatutsProgressionSnbcService } from './refresh-statuts-progression-snbc/refresh-statuts-progression-snbc.service';
import { z } from 'zod';

@Injectable()
export class SetScoreFromIndicateurRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    setScoreFromIndicateurErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: SetScoreFromIndicateurService,
    private readonly refreshStatutsProgressionSnbcService: RefreshStatutsProgressionSnbcService
  ) {}

  router = this.trpc.router({
    setScoreFromIndicateur: this.trpc.authedProcedure
      .input(setScoreFromIndicateurInputSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await this.service.setScoreFromIndicateur(input, {
          user: ctx.user,
        });
        return toSnapshotWithoutPayloads(
          this.getResultDataOrThrowError(result)
        );
      }),

    setIndicateurSuivi: this.trpc.authedProcedure
      .input(setIndicateurSuiviInputSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await this.service.setIndicateurSuivi(input, {
          user: ctx.user,
        });
        return toSnapshotWithoutPayloads(
          this.getResultDataOrThrowError(result)
        );
      }),

    // Rattrapage ponctuel de la bascule du score indicatif sur la SNBC 3 : à
    // retirer une fois exécuté en production. Sans `collectiviteIds`, traite
    // toutes les collectivités concernées. `modifiedBy` : compte inscrit dans
    // `action_statut.modified_by` (l'historique reste sans auteur).
    refreshStatutsProgressionSnbc: this.trpc.serviceRoleProcedure
      .input(
        z.object({
          collectiviteIds: z.array(z.number().int()).optional(),
          modifiedBy: z.uuid(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await this.refreshStatutsProgressionSnbcService.refresh(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
