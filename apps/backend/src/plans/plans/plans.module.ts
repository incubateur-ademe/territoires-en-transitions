import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { FichesModule } from '../fiches/fiches.module';
import { CompletionAnalyticsRouter } from './completion-analytics/completion-analytics.router';
import { CompletionAnalyticsService } from './completion-analytics/completion-analytics.service';
import { MutatePlanRepository } from './mutate-plan/mutate-plan.repository';
import { MutatePlanRouter } from './mutate-plan/mutate-plan.router';
import { MutatePlanService } from './mutate-plan/mutate-plan.service';
import { PlansRepository } from './plans.repository';
import { PlanRouter } from './plans.router';
import { PlanService } from './plans.service';

@Module({
  imports: [
    forwardRef(() => FichesModule),
    forwardRef(() => CollectivitesModule),
  ],
  providers: [
    PlanService,
    {
      provide: 'PlansRepositoryInterface',
      useClass: PlansRepository,
    },
    PlansRepository,
    PlanRouter,
    CompletionAnalyticsService,
    CompletionAnalyticsRouter,
    MutatePlanRepository,
    MutatePlanService,
    MutatePlanRouter,
  ],
  exports: [PlanService, PlanRouter, CompletionAnalyticsRouter, MutatePlanRouter],
})
export class PlanModule {}
