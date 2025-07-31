import {
  COMPUTE_TRAJECTOIRE_QUEUE_NAME,
  CronComputeTrajectoireService,
} from '@/tools/indicateurs/trajectoires/cron-compute-trajectoire.service';
import { UtilsModule } from '@/tools/utils/utils.module';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.registerQueue({
      name: COMPUTE_TRAJECTOIRE_QUEUE_NAME,
      defaultJobOptions: CronComputeTrajectoireService.DEFAULT_JOB_OPTIONS,
    }),
    BullBoardModule.forFeature({
      name: COMPUTE_TRAJECTOIRE_QUEUE_NAME,
      adapter: BullMQAdapter,
    }),
    UtilsModule,
  ],
  controllers: [],
  providers: [CronComputeTrajectoireService],
  exports: [CronComputeTrajectoireService],
})
export class ToolsIndicateursModule {}
