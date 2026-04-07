import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ListPersonnalisationQuestionsRouter } from './list-personnalisation-questions/list-personnalisation-questions.router';
import { ListPersonnalisationReglesRouter } from './list-personnalisation-regles/list-personnalisation-regles.router';
import { ListPersonnalisationThematiquesRouter } from './list-personnalisation-thematiques/list-personnalisation-thematiques.router';
import { SetPersonnalisationReponseRouter } from './set-personnalisation-reponse/set-personnalisation-reponse.router';

@Injectable()
export class PersonnalisationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly setReponse: SetPersonnalisationReponseRouter,
    private readonly listQuestions: ListPersonnalisationQuestionsRouter,
    private readonly listRegles: ListPersonnalisationReglesRouter,
    private readonly listThematiques: ListPersonnalisationThematiquesRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.setReponse.router,
    this.listQuestions.router,
    this.listRegles.router,
    this.listThematiques.router
  );
}
