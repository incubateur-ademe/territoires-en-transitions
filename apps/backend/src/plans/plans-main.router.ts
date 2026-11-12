import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { AxesRouter } from './axes/axes.router';
import { FichesRouter } from './fiches/fiches.router';
import { FindPreviousImportRouter } from './ai-plan-import/find-previous-import/find-previous-import.router';
import { GetImportStatusRouter } from './ai-plan-import/get-import-status/get-import-status.router';
import { GetImportCapabilitiesRouter } from './ai-plan-import/get-import-capabilities/get-import-capabilities.router';
import { ResumeImportRouter } from './ai-plan-import/resume-import/resume-import.router';
import { PlanRouter } from './plans/plans.router';
import { SuiviPlanRouter } from './plans/suivi-plan/suivi-plan.router';
import { GenerateReportsRouter } from './reports/generate-plan-report-pptx/generate-reports.router';

@Injectable()
export class PlanMainRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly fichesRouter: FichesRouter,
    private readonly planRouter: PlanRouter,
    private readonly suiviPlanRouter: SuiviPlanRouter,
    private readonly axesRouter: AxesRouter,
    private readonly generateReportsRouter: GenerateReportsRouter,
    private readonly getImportStatusRouter: GetImportStatusRouter,
    private readonly findPreviousImportRouter: FindPreviousImportRouter,
    private readonly resumeImportRouter: ResumeImportRouter,
    private readonly getImportCapabilitiesRouter: GetImportCapabilitiesRouter
  ) {}

  router = this.trpc.router({
    plans: this.planRouter.router,
    suivi: this.suiviPlanRouter.router,
    fiches: this.fichesRouter.router,
    axes: this.axesRouter.router,
    reports: this.generateReportsRouter.router,
    aiImport: this.trpc.mergeRouters(
      this.getImportStatusRouter.router,
      this.findPreviousImportRouter.router,
      this.resumeImportRouter.router,
      this.getImportCapabilitiesRouter.router
    ),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
