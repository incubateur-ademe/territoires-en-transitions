import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPersonnalisationQuestionsInputSchema } from './list-personnalisation-questions.input';
import ListPersonnalisationQuestionsService from './list-personnalisation-questions.service';

@Injectable()
export class ListPersonnalisationQuestionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPersonnalisationQuestionsService: ListPersonnalisationQuestionsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    listQuestionsReponses: this.trpc.authedProcedure
      .input(listPersonnalisationQuestionsInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.listPersonnalisationQuestionsService.listQuestionsReponses(
            input,
            ctx.user
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
