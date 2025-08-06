import { IndicateursDefinitionsPilotesRouter } from '@/backend/indicateurs/definitions/handle-definitions-pilotes/indicateurs-definitions-pilotes.router';
import { IndicateursDefinitionsServicesTagsRouter } from '@/backend/indicateurs/definitions/handle-definitions-services-tags/indicateurs-definitions-services-tags.router';
import { IndicateursDefinitionsThematiquesRouter } from '@/backend/indicateurs/definitions/handle-definitions-thematiques/indicateurs-definitions-thematiques.router';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HandlesDefinitionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly indicateursDefinitionsPilotesRouter: IndicateursDefinitionsPilotesRouter,
    private readonly indicateursDefinitionsServicesTagsRouter: IndicateursDefinitionsServicesTagsRouter,
    private readonly indicateursDefinitionsThematiquesRouter: IndicateursDefinitionsThematiquesRouter,
  ) { }

  router = this.trpc.router({
    indicateursPilotes: this.indicateursDefinitionsPilotesRouter.router,
    indicateursServicesPilotes: this.indicateursDefinitionsServicesTagsRouter.router,
    indicateursThematiques: this.indicateursDefinitionsThematiquesRouter.router,
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
