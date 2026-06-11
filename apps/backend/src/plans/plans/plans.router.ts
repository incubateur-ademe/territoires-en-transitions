import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ConfirmImportRouter } from './ai-plan-import/confirm-import/confirm-import.router';
import { DeletePlanRouter } from './delete-plan/delete-plan.router';
import { DuplicatePlanRouter } from './duplicate-plan/duplicate-plan.router';
import { GetPlanCompletionRouter } from './get-plan-completion/get-plan-completion.router';
import { GetImportStatusRouter } from './ai-plan-import/get-import-status/get-import-status.router';
import { GetPlanRouter } from './get-plan/get-plan.router';
import { ImportPlanRouter } from './import-plan-aggregate/import-plan.router';
import { ListPlanTypesRouter } from './list-plan-types/list-plan-types.router';
import { ListPlansRouter } from './list-plans/list-plans.router';
import { UpsertPlanRouter } from './upsert-plan/upsert-plan.router';

@Injectable()
export class PlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getPlanCompletionRouter: GetPlanCompletionRouter,
    private readonly upsertPlanRouter: UpsertPlanRouter,
    private readonly getPlanRouter: GetPlanRouter,
    private readonly listPlansRouter: ListPlansRouter,
    private readonly listPlanTypesRouter: ListPlanTypesRouter,
    private readonly deletePlanRouter: DeletePlanRouter,
    private readonly duplicatePlanRouter: DuplicatePlanRouter,
    private readonly importPlanRouter: ImportPlanRouter,
    private readonly getImportStatusRouter: GetImportStatusRouter,
    private readonly confirmImportRouter: ConfirmImportRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.getPlanCompletionRouter.router,
    this.upsertPlanRouter.router,
    this.getPlanRouter.router,
    this.listPlansRouter.router,
    this.listPlanTypesRouter.router,
    this.deletePlanRouter.router,
    this.duplicatePlanRouter.router,
    this.importPlanRouter.router,
    this.getImportStatusRouter.router,
    this.confirmImportRouter.router
  );
}
