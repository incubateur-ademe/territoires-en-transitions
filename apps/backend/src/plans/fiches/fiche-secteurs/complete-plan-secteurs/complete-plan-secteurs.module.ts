import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TrackingModule } from '@tet/backend/utils/tracking/tracking.module';
import { FichesModule } from '../../fiches.module';
import {
  COMPLETE_PLAN_SECTEURS_JOB_OPTIONS,
  COMPLETE_PLAN_SECTEURS_QUEUE_NAME,
} from './complete-plan-secteurs.queue';
import { CompletePlanSecteursService } from './complete-plan-secteurs.service';
import { CompletePlanSecteursWorker } from './complete-plan-secteurs.worker';
import { EnqueueCompletePlanSecteursService } from './enqueue-complete-plan-secteurs.service';

@Module({
  imports: [
    FichesModule,
    TrackingModule,
    BullModule.registerQueue({
      name: COMPLETE_PLAN_SECTEURS_QUEUE_NAME,
      defaultJobOptions: COMPLETE_PLAN_SECTEURS_JOB_OPTIONS,
    }),
  ],
  providers: [
    EnqueueCompletePlanSecteursService,
    CompletePlanSecteursService,
    CompletePlanSecteursWorker,
  ],
  exports: [EnqueueCompletePlanSecteursService],
})
export class CompletePlanSecteursModule {}
