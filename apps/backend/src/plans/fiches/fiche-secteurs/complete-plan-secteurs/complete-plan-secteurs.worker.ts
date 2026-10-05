import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  COMPLETE_PLAN_SECTEURS_LOCK_DURATION_MS,
  COMPLETE_PLAN_SECTEURS_QUEUE_NAME,
  CompletePlanSecteursJobData,
} from './complete-plan-secteurs.queue';
import { CompletePlanSecteursService } from './complete-plan-secteurs.service';

@Processor(COMPLETE_PLAN_SECTEURS_QUEUE_NAME, {
  lockDuration: COMPLETE_PLAN_SECTEURS_LOCK_DURATION_MS,
  concurrency: 1,
})
export class CompletePlanSecteursWorker extends WorkerHost {
  constructor(private readonly service: CompletePlanSecteursService) {
    super();
  }

  async process(job: Job<CompletePlanSecteursJobData>): Promise<void> {
    const result = await this.service.completePlan(job.data);
    if (!result.success) {
      throw new Error(
        `Rattrapage des secteurs du plan ${job.data.planId} en échec : ${result.error}`
      );
    }
  }
}
