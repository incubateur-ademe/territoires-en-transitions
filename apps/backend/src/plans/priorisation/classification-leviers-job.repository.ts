import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import {
  ClassificationLeviersErrorEnum,
  type ClassificationLeviersError,
} from './classification-leviers.errors';
import {
  ClassificationDraft,
  ClassificationLeviersJob,
  ClassificationLeviersJobStatus,
  ClassificationLeviersJobStatusEnum,
} from './models/classification-leviers-job';
import { classificationLeviersJobTable } from './models/classification-leviers-job.table';

const IN_FLIGHT_LEASE_MS = 30 * 60 * 1000;

const STALE_JOB_ERROR_MESSAGE =
  'Job abandonné : aucune progression depuis plus de trente minutes';

export type CreateClassificationJobInput = {
  collectiviteId: number;
  planId: number;
  createdBy: string;
};

@Injectable()
export class ClassificationLeviersJobRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(ClassificationLeviersJobRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async createUnlessInFlight(
    input: CreateClassificationJobInput
  ): Promise<Result<ClassificationLeviersJob, ClassificationLeviersError>> {
    try {
      const job = await this.insertUnlessInFlight(input);
      if (job) {
        return success(job);
      }

      const expired = await this.expireStaleInFlight(input.planId);
      if (!expired) {
        return failure(ClassificationLeviersErrorEnum.IN_FLIGHT_JOB_EXISTS);
      }

      const retried = await this.insertUnlessInFlight(input);
      if (!retried) {
        return failure(ClassificationLeviersErrorEnum.IN_FLIGHT_JOB_EXISTS);
      }

      return success(retried);
    } catch (error) {
      this.logger.error(
        `Création du job de classification: ${getErrorMessage(error)}`
      );
      return failure(ClassificationLeviersErrorEnum.CREATE_JOB_ERROR);
    }
  }

  private async insertUnlessInFlight(
    input: CreateClassificationJobInput
  ): Promise<ClassificationLeviersJob | undefined> {
    const [job] = await this.db
      .insert(classificationLeviersJobTable)
      .values({
        collectiviteId: input.collectiviteId,
        planId: input.planId,
        createdBy: input.createdBy,
        status: ClassificationLeviersJobStatusEnum.PENDING,
      })
      .onConflictDoNothing({
        target: classificationLeviersJobTable.planId,
        where: sql`status in ('pending', 'running')`,
      })
      .returning();

    return job;
  }

  private async expireStaleInFlight(planId: number): Promise<boolean> {
    const expired = await this.db
      .update(classificationLeviersJobTable)
      .set({
        status: ClassificationLeviersJobStatusEnum.FAILED,
        error: STALE_JOB_ERROR_MESSAGE,
        modifiedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(classificationLeviersJobTable.planId, planId),
          inArray(classificationLeviersJobTable.status, [
            ClassificationLeviersJobStatusEnum.PENDING,
            ClassificationLeviersJobStatusEnum.RUNNING,
          ]),
          lt(
            classificationLeviersJobTable.modifiedAt,
            new Date(Date.now() - IN_FLIGHT_LEASE_MS).toISOString()
          )
        )
      )
      .returning({ id: classificationLeviersJobTable.id });

    return expired.length > 0;
  }

  async getById(
    id: string
  ): Promise<Result<ClassificationLeviersJob, ClassificationLeviersError>> {
    try {
      const [job] = await this.db
        .select()
        .from(classificationLeviersJobTable)
        .where(eq(classificationLeviersJobTable.id, id))
        .limit(1);

      if (!job) {
        return failure(ClassificationLeviersErrorEnum.JOB_NOT_FOUND);
      }

      return success(job);
    } catch (error) {
      this.logger.error(
        `Lecture du job de classification ${id}: ${getErrorMessage(error)}`
      );
      return failure(ClassificationLeviersErrorEnum.GET_JOB_ERROR);
    }
  }

  async markRunning(
    id: string,
    totalBatches: number
  ): Promise<Result<void, ClassificationLeviersError>> {
    return this.transition(id, [ClassificationLeviersJobStatusEnum.PENDING], {
      status: ClassificationLeviersJobStatusEnum.RUNNING,
      totalBatches,
    });
  }

  async recordProcessedBatches(
    id: string,
    processedBatches: number
  ): Promise<void> {
    try {
      await this.db
        .update(classificationLeviersJobTable)
        .set({ processedBatches, modifiedAt: new Date().toISOString() })
        .where(
          and(
            eq(classificationLeviersJobTable.id, id),
            eq(
              classificationLeviersJobTable.status,
              ClassificationLeviersJobStatusEnum.RUNNING
            ),
            lt(classificationLeviersJobTable.processedBatches, processedBatches)
          )
        );
    } catch (error) {
      this.logger.error(
        `Progression du job de classification ${id}: ${getErrorMessage(error)}`
      );
    }
  }

  async markDone(
    id: string,
    draft: ClassificationDraft,
    tokenUsage: TokenUsage
  ): Promise<Result<void, ClassificationLeviersError>> {
    return this.transition(id, [ClassificationLeviersJobStatusEnum.RUNNING], {
      status: ClassificationLeviersJobStatusEnum.DONE,
      draft,
      tokenUsage,
    });
  }

  async markFailed(
    id: string,
    error: string
  ): Promise<Result<void, ClassificationLeviersError>> {
    return this.transition(
      id,
      [
        ClassificationLeviersJobStatusEnum.PENDING,
        ClassificationLeviersJobStatusEnum.RUNNING,
      ],
      { status: ClassificationLeviersJobStatusEnum.FAILED, error }
    );
  }

  private async transition(
    id: string,
    allowedFromStatuses: ClassificationLeviersJobStatus[],
    values: Partial<typeof classificationLeviersJobTable.$inferInsert>
  ): Promise<Result<void, ClassificationLeviersError>> {
    try {
      const transitioned = await this.db
        .update(classificationLeviersJobTable)
        .set({ ...values, modifiedAt: new Date().toISOString() })
        .where(
          and(
            eq(classificationLeviersJobTable.id, id),
            inArray(classificationLeviersJobTable.status, allowedFromStatuses)
          )
        )
        .returning({ id: classificationLeviersJobTable.id });

      if (transitioned.length === 0) {
        return failure(ClassificationLeviersErrorEnum.JOB_TRANSITION_REFUSED);
      }

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Mise à jour du job de classification ${id}: ${getErrorMessage(error)}`
      );
      return failure(ClassificationLeviersErrorEnum.UPDATE_JOB_ERROR);
    }
  }
}
