import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';
import { AiPlanImportJobRepository } from './ai-plan-import-job.repository';
import {
  AI_PLAN_IMPORT_JOB_OPTIONS,
  AI_PLAN_IMPORT_QUEUE_NAME,
} from './ai-plan-import.queue';
import { EnqueueImportController } from './enqueue-import/enqueue-import.controller';
import { EnqueueImportService } from './enqueue-import/enqueue-import.service';
import { GenerateImportDraftService } from './generate-import-draft/generate-import-draft.service';
import { GenerateImportDraftWorker } from './generate-import-draft/generate-import-draft.worker';
import { GetImportStatusRouter } from './get-import-status/get-import-status.router';
import { GetImportStatusService } from './get-import-status/get-import-status.service';

@Module({
  imports: [
    LlmModule,
    BullModule.registerQueue({
      name: AI_PLAN_IMPORT_QUEUE_NAME,
      defaultJobOptions: AI_PLAN_IMPORT_JOB_OPTIONS,
    }),
  ],
  controllers: [EnqueueImportController],
  providers: [
    AiPlanImportJobRepository,
    EnqueueImportService,
    GenerateImportDraftService,
    GenerateImportDraftWorker,
    GetImportStatusService,
    GetImportStatusRouter,
  ],
  exports: [GetImportStatusRouter, AiPlanImportJobRepository],
})
export class AiPlanImportModule {}
