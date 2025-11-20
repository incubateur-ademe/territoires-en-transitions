import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ListDefinitionsRouter } from './list-definitions/list-definitions.router';
import { MutateDefinitionRouter } from './mutate-definition/mutate-definition.router';

@Injectable()
export class IndicateurDefinitionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDefinitionsRouter: ListDefinitionsRouter,
    private readonly mutateDefinitionRouter: MutateDefinitionRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.listDefinitionsRouter.router,
    this.mutateDefinitionRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
