import { Module } from '@nestjs/common';
import { FichesModule } from '../fiches/fiches.module';
import UpdateFicheService from '../fiches/update-fiche/update-fiche.service';
import { PlansRepository } from './plans.repository';
import { PlanRouter } from './plans.router';
import { PlanService } from './plans.service';

@Module({
  imports: [FichesModule],
  providers: [
    PlanService,
    {
      provide: 'PlansRepositoryInterface',
      useClass: PlansRepository,
    },
    UpdateFicheService,
    PlansRepository,
    PlanRouter,
  ],
  exports: [PlanService, PlanRouter],
})
export class PlanModule {}
