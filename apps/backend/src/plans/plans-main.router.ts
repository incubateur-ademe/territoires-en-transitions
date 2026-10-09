import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { AxesRouter } from './axes/axes.router';
import { FichesRouter } from './fiches/fiches.router';
import { FindPreviousImportRouter } from './ai-plan-import/find-previous-import/find-previous-import.router';
import { GetImportStatusRouter } from './ai-plan-import/get-import-status/get-import-status.router';
import { PlanRouter } from './plans/plans.router';
import { GenerateReportsRouter } from './reports/generate-plan-report-pptx/generate-reports.router';

@Injectable()
export class PlanMainRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly fichesRouter: FichesRouter,
    private readonly planRouter: PlanRouter,
    private readonly axesRouter: AxesRouter,
    private readonly generateReportsRouter: GenerateReportsRouter,
    private readonly getImportStatusRouter: GetImportStatusRouter,
    private readonly findPreviousImportRouter: FindPreviousImportRouter
  ) {}

  router = this.trpc.router({
    plans: this.planRouter.router,
    fiches: this.fichesRouter.router,
    axes: this.axesRouter.router,
    reports: this.generateReportsRouter.router,
    aiImport: this.trpc.mergeRouters(
      this.getImportStatusRouter.router,
      this.findPreviousImportRouter.router
    ),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
