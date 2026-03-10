import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { actionIdSchema } from '@tet/domain/referentiels';
import { z } from 'zod';
import { ActionPersonnalisationsService } from './action-personnalisations.service';

const getNeededPersonnalisationQuestionsStatusInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  actionId: actionIdSchema,
});

@Injectable()
export class ActionPersonnalisationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly actionPersonnalisationsService: ActionPersonnalisationsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    getNeededPersonnalisationQuestionsStatus: this.trpc.authedProcedure
      .input(getNeededPersonnalisationQuestionsStatusInputSchema)
      .query(async ({ input, ctx }) => {
        const { collectiviteId, actionId } = input;
        const result =
          await this.actionPersonnalisationsService.getNeededPersonnalisationQuestionsStatus(
            collectiviteId,
            actionId,
            ctx.user
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
