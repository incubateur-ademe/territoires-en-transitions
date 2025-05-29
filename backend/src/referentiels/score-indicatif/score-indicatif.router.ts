import { getScoreIndicatifRequestSchema } from '@/backend/referentiels/score-indicatif/get-score-indicatif.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { ScoreIndicatifService } from './score-indicatif.service';

@Injectable()
export class ScoreIndicatifRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ScoreIndicatifService,
  ) {}

  router = this.trpc.router({
    getScoreIndicatif: this.trpc.authedProcedure
      .input(getScoreIndicatifRequestSchema)
      .query(({ ctx, input }) => {
        // TODO: vérifier les droits
        //, ctx.user
        return this.service.getScoreIndicatif(input);
      }),
  });
}
