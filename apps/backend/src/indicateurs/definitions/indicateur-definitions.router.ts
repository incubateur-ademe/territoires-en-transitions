import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { HandleDefinitionPilotesRouter } from './handle-definition-pilotes/handle-definition-pilotes.router';
import { HandleDefinitionServicesRouter } from './handle-definition-services/handle-definition-services.router';
import { HandleDefinitionThematiquesRouter } from './handle-definition-thematiques/handle-definition-thematiques.router';
import { ListDefinitionsRouter } from './list-definitions/list-definitions.router';
import { UpdateIndicateurDefinitionsRouter } from './update-definitions/update-definitions.router';

@Injectable()
export class IndicateurDefinitionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDefinitionsRouter: ListDefinitionsRouter,
    private readonly updateIndicateurDefinitionRouter: UpdateIndicateurDefinitionsRouter,
    private readonly indicateursDefinitionsPilotesRouter: HandleDefinitionPilotesRouter,
    private readonly indicateursDefinitionsServicesRouter: HandleDefinitionServicesRouter,
    private readonly indicateursDefinitionsThematiquesRouter: HandleDefinitionThematiquesRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.listDefinitionsRouter.router,
    this.updateIndicateurDefinitionRouter.router,
    this.indicateursDefinitionsPilotesRouter.router,
    this.indicateursDefinitionsServicesRouter.router,
    this.indicateursDefinitionsThematiquesRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
