import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { setScoreFromIndicateurErrorConfig } from './set-score-from-indicateur.errors';
import { setScoreFromIndicateurInputSchema } from './set-score-from-indicateur.input';
import { SetScoreFromIndicateurService } from './set-score-from-indicateur.service';

@Injectable()
export class SetScoreFromIndicateurRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    setScoreFromIndicateurErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: SetScoreFromIndicateurService
  ) {}

  router = this.trpc.router({
    setScoreFromIndicateur: this.trpc.authedProcedure
      .input(setScoreFromIndicateurInputSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await this.service.setScoreFromIndicateur(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
