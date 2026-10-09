import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from './ai-plan-import.errors';
import { aiPlanImportStepRunTable } from './models/ai-plan-import-step-run.table';
import { ImportStepRun } from './models/import-step-run';
import { computeLlmCallMetrics } from './pipeline/compute-import-metrics';

@Injectable()
export class AiPlanImportStepRunRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(AiPlanImportStepRunRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async insert(
    jobId: string,
    run: ImportStepRun
  ): Promise<Result<undefined, AiPlanImportError>> {
    const { calls, failedCalls, rateLimited, tokens, models } =
      computeLlmCallMetrics(run.calls);
    try {
      await this.db
        .insert(aiPlanImportStepRunTable)
        .values({
          jobId,
          step: run.step,
          status: run.status,
          startedAt: run.startedAt.toISOString(),
          endedAt: run.endedAt.toISOString(),
          durationMs: run.endedAt.getTime() - run.startedAt.getTime(),
          llmCalls: calls,
          failedCalls,
          rateLimitedCalls: rateLimited,
          tokens,
          models,
          details: run.details,
          error: run.error,
        })
        .onConflictDoNothing();
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Enregistrement de l'étape ${
          run.step
        } du job ${jobId}: ${getErrorMessage(error)}`
      );
      return failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR);
    }
  }
}
