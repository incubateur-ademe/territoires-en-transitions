import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { DeleteAxeRouter } from './delete-axe/delete-axe.router';
import { GetAxeRouter } from './get-axe/get-axe.router';
import { ListAxesRouter } from './list-axes/list-axes.router';
import { MutateAxeRouter } from './mutate-axe/mutate-axe.router';

@Injectable()
export class AxesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly mutateAxeRouter: MutateAxeRouter,
    private readonly listAxesRouter: ListAxesRouter,
    private readonly getAxeRouter: GetAxeRouter,
    private readonly deleteAxeRouter: DeleteAxeRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.mutateAxeRouter.router,
    this.listAxesRouter.router,
    this.getAxeRouter.router,
    this.deleteAxeRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
