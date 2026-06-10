import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray } from 'drizzle-orm';
import { PlanDraft } from './models/plan-draft';
import {
  AiPlanImportJob,
  aiPlanImportJobInFlightStatuses,
  AiPlanImportJobOptions,
  AiPlanImportJobStatus,
  aiPlanImportJobStatusSchema,
  AiPlanImportJobStatusEnum,
  aiPlanImportJobTable,
} from './models/ai-plan-import-job.table';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from './ai-plan-import.errors';
import {
  initialStepStates,
  StepStates,
} from './generate-import-draft/run-import-pipeline';

export type CreateJobInput = {
  collectiviteId: number;
  createdBy: string;
  sourcePath: string;
  options: AiPlanImportJobOptions;
};

@Injectable()
export class AiPlanImportJobRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(AiPlanImportJobRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async createOrGetInFlight(
    input: CreateJobInput
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    try {
      const [created] = await this.db
        .insert(aiPlanImportJobTable)
        .values({
          collectiviteId: input.collectiviteId,
          createdBy: input.createdBy,
          sourcePath: input.sourcePath,
          options: input.options,
          status: AiPlanImportJobStatusEnum.PENDING,
          stepStates: initialStepStates(),
        })
        .onConflictDoNothing()
        .returning();

      if (created) {
        return this.parseRow(created);
      }

      return failure(AiPlanImportErrorEnum.IN_FLIGHT_JOB_EXISTS);
    } catch (error) {
      this.logger.error(`Création du job d'import: ${getErrorMessage(error)}`);
      return failure(
        AiPlanImportErrorEnum.CREATE_JOB_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async getByIdRaw(
    id: string
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    try {
      const [row] = await this.db
        .select()
        .from(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.id, id))
        .limit(1);

      if (!row) {
        return failure(AiPlanImportErrorEnum.JOB_NOT_FOUND);
      }

      return this.parseRow(row);
    } catch (error) {
      this.logger.error(
        `Lecture du job d'import ${id}: ${getErrorMessage(error)}`
      );
      return failure(
        AiPlanImportErrorEnum.GET_JOB_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async countInFlight(): Promise<Result<number, AiPlanImportError>> {
    try {
      const rows = await this.db
        .select({ id: aiPlanImportJobTable.id })
        .from(aiPlanImportJobTable)
        .where(
          inArray(aiPlanImportJobTable.status, [
            ...aiPlanImportJobInFlightStatuses,
          ])
        );
      return success(rows.length);
    } catch (error) {
      this.logger.error(
        `Comptage des jobs en cours: ${getErrorMessage(error)}`
      );
      return failure(
        AiPlanImportErrorEnum.GET_JOB_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async transitionToRunning(
    id: string
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    return this.updateAndReturn(
      id,
      {
        status: AiPlanImportJobStatusEnum.RUNNING,
        error: null,
        modifiedAt: new Date().toISOString(),
      },
      [AiPlanImportJobStatusEnum.PENDING, AiPlanImportJobStatusEnum.RUNNING]
    );
  }

  async markDone(input: {
    id: string;
    draft: PlanDraft;
    stepStates: StepStates;
  }): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    return this.updateAndReturn(
      input.id,
      {
        status: AiPlanImportJobStatusEnum.DONE,
        draft: input.draft,
        stepStates: input.stepStates,
        modifiedAt: new Date().toISOString(),
      },
      [AiPlanImportJobStatusEnum.RUNNING]
    );
  }

  async markFailed(input: {
    id: string;
    error: string;
    stepStates: StepStates;
  }): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    return this.updateAndReturn(
      input.id,
      {
        status: AiPlanImportJobStatusEnum.FAILED,
        error: input.error,
        stepStates: input.stepStates,
        modifiedAt: new Date().toISOString(),
      },
      [AiPlanImportJobStatusEnum.RUNNING]
    );
  }

  async deleteIfPending(
    id: string
  ): Promise<Result<undefined, AiPlanImportError>> {
    try {
      await this.db
        .delete(aiPlanImportJobTable)
        .where(
          and(
            eq(aiPlanImportJobTable.id, id),
            eq(aiPlanImportJobTable.status, AiPlanImportJobStatusEnum.PENDING)
          )
        );
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Suppression du job pending ${id}: ${getErrorMessage(error)}`
      );
      return failure(
        AiPlanImportErrorEnum.UPDATE_JOB_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  private async updateAndReturn(
    id: string,
    patch: Partial<typeof aiPlanImportJobTable.$inferInsert>,
    allowedFromStatuses: AiPlanImportJobStatus[]
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    try {
      const [row] = await this.db
        .update(aiPlanImportJobTable)
        .set(patch)
        .where(
          and(
            eq(aiPlanImportJobTable.id, id),
            inArray(aiPlanImportJobTable.status, allowedFromStatuses)
          )
        )
        .returning();

      if (!row) {
        return failure(AiPlanImportErrorEnum.JOB_NOT_FOUND);
      }

      return this.parseRow(row);
    } catch (error) {
      this.logger.error(
        `Mise à jour du job ${id}: ${getErrorMessage(error)}`
      );
      return failure(
        AiPlanImportErrorEnum.UPDATE_JOB_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  private parseRow(
    row: AiPlanImportJob
  ): Result<AiPlanImportJob, AiPlanImportError> {
    const parsedStatus = aiPlanImportJobStatusSchema.safeParse(row.status);
    if (!parsedStatus.success) {
      return failure(
        AiPlanImportErrorEnum.JOB_STATUS_PARSE_ERROR,
        parsedStatus.error
      );
    }
    return success({ ...row, status: parsedStatus.data });
  }
}
