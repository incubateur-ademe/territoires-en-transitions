import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ListPersonnalisationQuestionsRouter } from './list-personnalisation-questions/list-personnalisation-questions.router';
import { ListPersonnalisationReponsesRouter } from './list-personnalisation-reponses/list-personnalisation-reponses.router';
import { ListPersonnalisationThematiquesRouter } from './list-personnalisation-thematiques/list-personnalisation-thematiques.router';
import { SetPersonnalisationReponseRouter } from './set-personnalisation-reponse/set-personnalisation-reponse.router';

@Injectable()
export class PersonnalisationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly setReponse: SetPersonnalisationReponseRouter,
    private readonly listQuestions: ListPersonnalisationQuestionsRouter,
    private readonly listReponses: ListPersonnalisationReponsesRouter,
    private readonly listThematiques: ListPersonnalisationThematiquesRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.setReponse.router,
    this.listReponses.router,
    this.listQuestions.router,
    this.listThematiques.router
  );
}
