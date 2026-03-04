import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { GetQuestionThematiqueCompletudeService } from './get-question-thematique-completude.service';

const getQuestionThematiqueCompletudeInputSchema = z.object({
  collectiviteId: z.number(),
});

@Injectable()
export class GetQuestionThematiqueCompletudeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getQuestionThematiqueCompletudeService: GetQuestionThematiqueCompletudeService
  ) {}

  router = this.trpc.router({
    getQuestionThematiqueCompletude: this.trpc.authedProcedure
      .input(getQuestionThematiqueCompletudeInputSchema)
      .query(async ({ input, ctx }) => {
        return this.getQuestionThematiqueCompletudeService.getQuestionThematiqueCompletude(
          input.collectiviteId,
          ctx.user
        );
      }),
  });
}
