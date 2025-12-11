import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { DeleteAxeRouter } from './delete-axe/delete-axe.router';
import { GetAxeRouter } from './get-axe/get-axe.router';
import { ListAxesRouter } from './list-axes/list-axes.router';
import { UpsertAxeRouter } from './upsert-axe/upsert-axe.router';

@Injectable()
export class AxesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly upsertAxeRouter: UpsertAxeRouter,
    private readonly listAxesRouter: ListAxesRouter,
    private readonly getAxeRouter: GetAxeRouter,
    private readonly deleteAxeRouter: DeleteAxeRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.upsertAxeRouter.router,
    this.listAxesRouter.router,
    this.getAxeRouter.router,
    this.deleteAxeRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
