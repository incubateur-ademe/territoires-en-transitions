import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { AxesRouter } from './axes/axes.router';
import { FichesRouter } from './fiches/fiches.router';
import { GenerateReportsRouter } from './plans/generate-plan-report-pptx/generate-reports.router';
import { PlanRouter } from './plans/plans.router';

@Injectable()
export class PlanMainRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly fichesRouter: FichesRouter,
    private readonly planRouter: PlanRouter,
    private readonly axesRouter: AxesRouter,
    private readonly generateReportsRouter: GenerateReportsRouter
  ) {}

  router = this.trpc.router({
    plans: this.planRouter.router,
    fiches: this.fichesRouter.router,
    axes: this.axesRouter.router,
    reports: this.generateReportsRouter.router,
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
