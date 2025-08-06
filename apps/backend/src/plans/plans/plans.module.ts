import { CollectivitesModule } from '@/backend/collectivites/collectivites.module';
import { Module } from '@nestjs/common';
import { FichesModule } from '../fiches/fiches.module';
import { PlansRepository } from './plans.repository';
import { PlanRouter } from './plans.router';
import { PlanService } from './plans.service';

@Module({
  imports: [FichesModule, CollectivitesModule],
  providers: [
    PlanService,
    {
      provide: 'PlansRepositoryInterface',
      useClass: PlansRepository,
    },
    PlansRepository,
    PlanRouter,
  ],
  exports: [PlanService, PlanRouter],
})
export class PlanModule {}
