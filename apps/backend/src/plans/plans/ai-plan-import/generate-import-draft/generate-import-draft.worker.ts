import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import {
  AI_PLAN_IMPORT_CONCURRENCY,
  AI_PLAN_IMPORT_LOCK_DURATION_MS,
  AI_PLAN_IMPORT_QUEUE_NAME,
  type AiPlanImportJobData,
} from '../ai-plan-import.queue';
import { GenerateImportDraftService } from './generate-import-draft.service';

@Processor(AI_PLAN_IMPORT_QUEUE_NAME, {
  lockDuration: AI_PLAN_IMPORT_LOCK_DURATION_MS,
  concurrency: AI_PLAN_IMPORT_CONCURRENCY,
})
export class GenerateImportDraftWorker extends WorkerHost {
  constructor(private readonly service: GenerateImportDraftService) {
    super();
  }

  async process(job: Job<AiPlanImportJobData>): Promise<void> {
    const result = await this.service.generate(job.data.jobId);
    if (!result.success) {
      throw new UnrecoverableError(result.error);
    }
  }
}
