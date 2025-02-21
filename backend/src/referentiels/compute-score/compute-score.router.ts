import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { getReferentielScoresRequestSchema } from '../models/get-referentiel-scores.request';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';
import ScoresService from './scores.service';

export const computeScoreRequestSchema = z.object({
  referentielId: referentielIdEnumSchema,
  collectiviteId: z.number().int(),
  parameters: getReferentielScoresRequestSchema,
});

@Injectable()
export class ComputeScoreRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ScoresService
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
