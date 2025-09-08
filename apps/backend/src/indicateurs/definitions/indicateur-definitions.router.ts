import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
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
