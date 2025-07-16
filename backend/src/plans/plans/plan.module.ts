import { Module } from '@nestjs/common';
import { DatabaseService } from '../../utils/database/database.service';
import { TrpcService } from '../../utils/trpc/trpc.service';
import { PlansRepository } from './plan.repository';
import { PlanRouter } from './plan.router';
import { PlanService } from './plan.service';

@Module({
  providers: [
    PlanService,
    {
      provide: 'PlansRepositoryInterface',
      useClass: PlansRepository,
    },
    PlansRepository,
    PlanRouter,
    DatabaseService,
    TrpcService,
  ],
  exports: [PlanService, PlanRouter],
})
export class PlanModule {}
