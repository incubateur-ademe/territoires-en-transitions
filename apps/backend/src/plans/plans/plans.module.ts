import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { AxeModule } from '../axes/axe.module';
import { DeleteAxeRepository } from '../axes/delete-axe/delete-axe.repository';
import { DeleteAxeRouter } from '../axes/delete-axe/delete-axe.router';
import { DeleteAxeService } from '../axes/delete-axe/delete-axe.service';
import { GetAxeRepository } from '../axes/get-axe/get-axe.repository';
import { GetAxeRouter } from '../axes/get-axe/get-axe.router';
import { GetAxeService } from '../axes/get-axe/get-axe.service';
import { ListAxesRepository } from '../axes/list-axes/list-axes.repository';
import { ListAxesRouter } from '../axes/list-axes/list-axes.router';
import { ListAxesService } from '../axes/list-axes/list-axes.service';
import { UpsertAxeRepository } from '../axes/upsert-axe/upsert-axe.repository';
import { UpsertAxeRouter } from '../axes/upsert-axe/upsert-axe.router';
import { UpsertAxeService } from '../axes/upsert-axe/upsert-axe.service';
import { FichesModule } from '../fiches/fiches.module';
import { ComputeBudgetRules } from './compute-budget/compute-budget.rules';
import { DeletePlanRepository } from './delete-plan/delete-plan.repository';
import { DeletePlanRouter } from './delete-plan/delete-plan.router';
import { DeletePlanService } from './delete-plan/delete-plan.service';
import { GetPlanCompletionRouter } from './get-plan-completion/get-plan-completion.router';
import { GetPlanCompletionService } from './get-plan-completion/get-plan-completion.service';
import { GetPlanRepository } from './get-plan/get-plan.repository';
import { GetPlanRouter } from './get-plan/get-plan.router';
import { GetPlanService } from './get-plan/get-plan.service';
import { ListPlansRepository } from './list-plans/list-plans.repository';
import { ListPlansRouter } from './list-plans/list-plans.router';
import { ListPlansService } from './list-plans/list-plans.service';
import { PlanRouter } from './plans.router';
import { PlanProgressRules } from './progress/plan-progress.rules';
import { UpsertPlanRepository } from './upsert-plan/upsert-plan.repository';
import { UpsertPlanRouter } from './upsert-plan/upsert-plan.router';
import { UpsertPlanService } from './upsert-plan/upsert-plan.service';

@Module({
  imports: [
    forwardRef(() => CollectivitesModule),
    forwardRef(() => FichesModule),
    AxeModule,
  ],
  providers: [
    GetPlanCompletionService,
    GetPlanCompletionRouter,
    DeleteAxeService,
    DeleteAxeRouter,
    DeleteAxeRepository,
    GetAxeService,
    GetAxeRouter,
    GetAxeRepository,
    ListAxesRepository,
    ListAxesService,
    ListAxesRouter,
    UpsertAxeService,
    UpsertAxeRouter,
    UpsertAxeRepository,
    DeletePlanRepository,
    DeletePlanService,
    DeletePlanRouter,
    GetPlanRepository,
    GetPlanService,
    GetPlanRouter,
    ListPlansRepository,
    ListPlansService,
    ListPlansRouter,
    UpsertPlanRepository,
    UpsertPlanService,
    UpsertPlanRouter,
    PlanProgressRules,
    ComputeBudgetRules,
    PlanRouter,
  ],
  exports: [
    PlanRouter,
    UpsertPlanService,
    ListPlansService,
    GetPlanService,
    PlanProgressRules,
    ComputeBudgetRules,
  ],
})
export class PlanModule {}
