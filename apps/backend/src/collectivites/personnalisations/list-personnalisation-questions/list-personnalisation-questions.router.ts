import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPersonnalisationQuestionsInputSchema } from './list-personnalisation-questions.input';
import ListPersonnalisationQuestionsService from './list-personnalisation-questions.service';

@Injectable()
export class ListPersonnalisationQuestionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPersonnalisationQuestionsService: ListPersonnalisationQuestionsService
  ) {}

  router = this.trpc.router({
    listQuestions: this.trpc.authedProcedure
      .input(listPersonnalisationQuestionsInputSchema)
      .query(async ({ input }) => {
        return this.listPersonnalisationQuestionsService.listQuestionsWithChoices(
          input
        );
      }),
  });
}
