import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { GetPersonnalisationReponsesRouter } from './get-personnalisation-reponses/get-personnalisation-reponses.router';
import { ListPersonnalisationQuestionsRouter } from './list-personnalisation-questions/list-personnalisation-questions.router';
import { SetPersonnalisationReponseRouter } from './set-personnalisation-reponse/set-personnalisation-reponse.router';

@Injectable()
export class PersonnalisationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly setReponse: SetPersonnalisationReponseRouter,
    private readonly getReponses: GetPersonnalisationReponsesRouter,
    private readonly listQuestions: ListPersonnalisationQuestionsRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.setReponse.router,
    this.getReponses.router,
    this.listQuestions.router
  );
}
