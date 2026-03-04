import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { GetQuestionThematiqueCompletudeRouter } from './get-question-thematique-completude/get-question-thematique-completude.router';
import { SetPersonnalisationReponseRouter } from './set-personnalisation-reponse/set-personnalisation-reponse.router';

@Injectable()
export class PersonnalisationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly setReponse: SetPersonnalisationReponseRouter,
    private readonly getQuestionThematiqueCompletude: GetQuestionThematiqueCompletudeRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.setReponse.router,
    this.getQuestionThematiqueCompletude.router
  );
}
