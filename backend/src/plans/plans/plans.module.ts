import { Module } from '@nestjs/common';
import { DatabaseService } from '../../utils/database/database.service';
import { TrpcService } from '../../utils/trpc/trpc.service';
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
    DatabaseService,
    TrpcService,
  ],
  exports: [PlanService, PlanRouter],
})
export class PlanModule {}
