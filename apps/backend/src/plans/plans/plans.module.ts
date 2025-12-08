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
import { MutateAxeRepository } from '../axes/mutate-axe/mutate-axe.repository';
import { MutateAxeRouter } from '../axes/mutate-axe/mutate-axe.router';
import { MutateAxeService } from '../axes/mutate-axe/mutate-axe.service';
import { FichesModule } from '../fiches/fiches.module';
import { CompletionAnalyticsRouter } from './completion-analytics/completion-analytics.router';
import { CompletionAnalyticsService } from './completion-analytics/completion-analytics.service';
import { DeletePlanRepository } from './delete-plan/delete-plan.repository';
import { DeletePlanRouter } from './delete-plan/delete-plan.router';
import { DeletePlanService } from './delete-plan/delete-plan.service';
import { GetPlanRepository } from './get-plan/get-plan.repository';
import { GetPlanRouter } from './get-plan/get-plan.router';
import { GetPlanService } from './get-plan/get-plan.service';
import { ListPlansRepository } from './list-plans/list-plans.repository';
import { ListPlansRouter } from './list-plans/list-plans.router';
import { ListPlansService } from './list-plans/list-plans.service';
import { MutatePlanRepository } from './mutate-plan/mutate-plan.repository';
import { MutatePlanRouter } from './mutate-plan/mutate-plan.router';
import { MutatePlanService } from './mutate-plan/mutate-plan.service';
import { PlanRouter } from './plans.router';

@Module({
  imports: [
    forwardRef(() => CollectivitesModule),
    forwardRef(() => FichesModule),
    AxeModule,
  ],
  providers: [
    CompletionAnalyticsService,
    CompletionAnalyticsRouter,
    DeleteAxeService,
    DeleteAxeRouter,
    DeleteAxeRepository,
    GetAxeService,
    GetAxeRouter,
    GetAxeRepository,
    ListAxesRepository,
    ListAxesService,
    ListAxesRouter,
    MutateAxeService,
    MutateAxeRouter,
    MutateAxeRepository,
    DeletePlanRepository,
    DeletePlanService,
    DeletePlanRouter,
    GetPlanRepository,
    GetPlanService,
    GetPlanRouter,
    ListPlansRepository,
    ListPlansService,
    ListPlansRouter,
    MutatePlanRepository,
    MutatePlanService,
    MutatePlanRouter,
    PlanRouter,
  ],
  exports: [PlanRouter, MutatePlanService, ListPlansService],
})
export class PlanModule {}
