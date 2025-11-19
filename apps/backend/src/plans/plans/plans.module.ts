import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { FichesModule } from '../fiches/fiches.module';
import { CompletionAnalyticsRouter } from './completion-analytics/completion-analytics.router';
import { CompletionAnalyticsService } from './completion-analytics/completion-analytics.service';
import { PlansRepository } from './plans.repository';
import { PlanRouter } from './plans.router';
import { PlanService } from './plans.service';
import { PlanProgressRules } from './progress/plan-progress.rules';

@Module({
  imports: [
    forwardRef(() => FichesModule),
    forwardRef(() => CollectivitesModule),
  ],
  providers: [
    PlanService,
    PlanProgressRules,
    {
      provide: 'PlansRepositoryInterface',
      useClass: PlansRepository,
    },
    PlansRepository,
    PlanRouter,
    CompletionAnalyticsService,
    CompletionAnalyticsRouter,
  ],
  exports: [
    PlanService,
    PlanProgressRules,
    PlanRouter,
    CompletionAnalyticsRouter,
  ],
})
export class PlanModule {}
