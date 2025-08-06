import { HandlesDefinitionsRouter } from '@/backend/indicateurs/definitions/handles-definitions.router';
import { UpdateIndicateursDefinitionsRouter } from '@/backend/indicateurs/definitions/update-indicateurs-definitions/update-indicateurs-definitions.router';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IndicateursDefinitionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly handleDefinitionsRouter: HandlesDefinitionsRouter,
    private readonly updateIndicateurDefinitionRouter: UpdateIndicateursDefinitionsRouter,

  ) { }

  router =
    this.trpc.mergeRouters(
      this.handleDefinitionsRouter.router,
      this.updateIndicateurDefinitionRouter.router
    );

  createCaller = this.trpc.createCallerFactory(this.router);
}
