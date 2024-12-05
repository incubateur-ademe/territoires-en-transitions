import { Injectable } from '@nestjs/common';
import z from 'zod';
import { TrpcService } from '../../trpc/trpc.service';
import { getReferentielScoresRequestSchema } from '../models/get-referentiel-scores.request';
import { ReferentielType } from '../models/referentiel.enum';
import ReferentielsScoringService from '../services/referentiels-scoring.service';

export const computeScoreRequestSchema = z.object({
  referentielId: z.nativeEnum(ReferentielType),
  collectiviteId: z.number().int(),
  parameters: getReferentielScoresRequestSchema,
});

@Injectable()
export class ComputeScoreRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ReferentielsScoringService
  ) {}

  router = this.trpc.router({
    computeScore: this.trpc.authedProcedure
      .input(computeScoreRequestSchema)
      .query(({ input, ctx }) => {
        return this.service.computeScoreForCollectivite(
          input.referentielId,
          input.collectiviteId,
          input.parameters,
          ctx.user
        );
      }),
  });
}
