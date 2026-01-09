import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { GenerateReportInput } from '@tet/domain/plans';
import { Job } from 'bullmq';
import {
  GenerateReportsService,
  PLAN_REPORT_GENERATION_QUEUE_NAME,
} from './generate-reports.service';

interface PlanReportGenerationJobData {
  generationId: string;
  request: GenerateReportInput;
  userId: string;
}

@Processor(PLAN_REPORT_GENERATION_QUEUE_NAME)
export class GenerateReportsWorker extends WorkerHost {
  private readonly logger = new Logger(GenerateReportsWorker.name);

  constructor(
    private readonly generateReportsService: GenerateReportsService,
    private readonly contextStoreService: ContextStoreService
  ) {
    super();
  }

  async process(
    job: Job<PlanReportGenerationJobData>
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `Processing plan report generation job ${job.id} for generation ${job.data.generationId}`
    );

    const result = await this.generateReportsService.generatePlanReport(
      job.data.generationId,
      job.data.request,
      job.data.userId
    );

    if (!result.success) {
      this.logger.error(
        `Failed to generate plan report for generation ${job.data.generationId}: ${result.error}`
      );
      // Do not throw, we don't want to retry the job
    } else {
      this.logger.log(
        `Successfully generated plan report for generation ${job.data.generationId}`
      );
    }

    return {
      success: result.success,
    };
  }
}
