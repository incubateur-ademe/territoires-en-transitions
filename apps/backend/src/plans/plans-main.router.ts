import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { AxesRouter } from './axes/axes.router';
import { FichesRouter } from './fiches/fiches.router';
import { PlanRouter } from './plans/plans.router';

@Injectable()
export class PlanMainRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly fichesRouter: FichesRouter,
    private readonly planRouter: PlanRouter,
    private readonly axesRouter: AxesRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.planRouter.router,
    this.trpc.router({
      fiches: this.fichesRouter.router,
      axes: this.axesRouter.router,
    })
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
