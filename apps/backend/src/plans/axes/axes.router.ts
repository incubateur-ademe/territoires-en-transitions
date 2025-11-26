import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { ListAxesRouter } from './list-axes/list-axes.router';
import { MutateAxeRouter } from './mutate-axe/mutate-axe.router';

@Injectable()
export class AxesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly mutateAxeRouter: MutateAxeRouter,
    private readonly listAxesRouter: ListAxesRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.mutateAxeRouter.router,
    this.listAxesRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}

