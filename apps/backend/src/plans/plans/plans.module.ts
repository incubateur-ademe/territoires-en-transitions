import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { FichesModule } from '../fiches/fiches.module';
import { CompletionAnalyticsRouter } from './completion-analytics/completion-analytics.router';
import { CompletionAnalyticsService } from './completion-analytics/completion-analytics.service';
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
  ],
  exports: [PlanService, PlanRouter, CompletionAnalyticsRouter],
})
export class PlanModule {}
