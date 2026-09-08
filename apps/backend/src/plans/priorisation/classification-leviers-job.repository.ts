import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray, lt } from 'drizzle-orm';
import {
  ClassificationLeviersErrorEnum,
  type ClassificationLeviersError,
} from './classification-leviers.errors';
import { ClassificationDraft } from './models/classification-draft';
import {
  ClassificationLeviersJob,
  classificationLeviersJobInFlightStatuses,
  ClassificationLeviersJobStatus,
  ClassificationLeviersJobStatusEnum,
  IN_FLIGHT_LEASE_MS,
} from './models/classification-leviers-job';
import {
  classificationLeviersJobTable,
  inFlightStatusPredicate,
} from './models/classification-leviers-job.table';

const STALE_JOB_ERROR_MESSAGE =
  'Job abandonné : aucune progression depuis plus de trente minutes';

const progressProjection = {
  id: classificationLeviersJobTable.id,
  collectiviteId: classificationLeviersJobTable.collectiviteId,
  planId: classificationLeviersJobTable.planId,
  status: classificationLeviersJobTable.status,
  processedBatches: classificationLeviersJobTable.processedBatches,
  totalBatches: classificationLeviersJobTable.totalBatches,
  draft: classificationLeviersJobTable.draft,
  error: classificationLeviersJobTable.error,
};

export type ClassificationProgress = {
  [K in keyof typeof progressProjection]: ClassificationLeviersJob[K];
};

export type CreateClassificationJobInput = {
  collectiviteId: number;
  planId: number;
  createdBy: string;
};

@Injectable()
export class ClassificationLeviersJobRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(
    ClassificationLeviersJobRepository.name
  );

  constructor(private readonly database: DatabaseService) {}

  async createUnlessInFlight(
    input: CreateClassificationJobInput
  ): Promise<Result<ClassificationLeviersJob, ClassificationLeviersError>> {
    try {
      const job = await this.insertUnlessInFlight(input);
      if (job) {
        return success(job);
      }

      const hasExpiredStaleJob = await this.expireStaleInFlight(input.planId);
      if (!hasExpiredStaleJob) {
        return failure(ClassificationLeviersErrorEnum.IN_FLIGHT_JOB_EXISTS);
      }

      const jobAfterExpiry = await this.insertUnlessInFlight(input);
      if (!jobAfterExpiry) {
        return failure(ClassificationLeviersErrorEnum.IN_FLIGHT_JOB_EXISTS);
      }

      return success(jobAfterExpiry);
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
        where: inFlightStatusPredicate,
      })
      .returning();

    return job;
  }

  private async expireStaleInFlight(planId: number): Promise<boolean> {
    const expiredJobs = await this.db
      .update(classificationLeviersJobTable)
      .set({
        status: ClassificationLeviersJobStatusEnum.FAILED,
        error: STALE_JOB_ERROR_MESSAGE,
        modifiedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(classificationLeviersJobTable.planId, planId),
          inArray(
            classificationLeviersJobTable.status,
            classificationLeviersJobInFlightStatuses
          ),
          lt(
            classificationLeviersJobTable.modifiedAt,
            new Date(Date.now() - IN_FLIGHT_LEASE_MS).toISOString()
          )
        )
      )
      .returning({ id: classificationLeviersJobTable.id });

    return expiredJobs.length > 0;
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

  async getProgressById(
    id: string
  ): Promise<Result<ClassificationProgress, ClassificationLeviersError>> {
    try {
      const [progress] = await this.db
        .select(progressProjection)
        .from(classificationLeviersJobTable)
        .where(eq(classificationLeviersJobTable.id, id))
        .limit(1);

      if (!progress) {
        return failure(ClassificationLeviersErrorEnum.JOB_NOT_FOUND);
      }

      return success(progress);
    } catch (error) {
      this.logger.error(
        `Lecture de la progression du job ${id}: ${getErrorMessage(error)}`
      );
      return failure(ClassificationLeviersErrorEnum.GET_JOB_ERROR);
    }
  }

  async markRunning(
    id: string,
    totalBatches: number
  ): Promise<Result<void, ClassificationLeviersError>> {
    return this.transition({
      id,
      allowedFromStatuses: [ClassificationLeviersJobStatusEnum.PENDING],
      values: {
        status: ClassificationLeviersJobStatusEnum.RUNNING,
        totalBatches,
      },
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

  async markDone({
    id,
    draft,
    tokenUsage,
    tx,
  }: {
    id: string;
    draft: ClassificationDraft;
    tokenUsage: TokenUsage;
    tx?: Transaction;
  }): Promise<Result<void, ClassificationLeviersError>> {
    return this.transition({
      id,
      allowedFromStatuses: [ClassificationLeviersJobStatusEnum.RUNNING],
      values: {
        status: ClassificationLeviersJobStatusEnum.DONE,
        draft,
        tokenUsage,
      },
      tx,
    });
  }

  async markFailed(
    id: string,
    error: string
  ): Promise<Result<void, ClassificationLeviersError>> {
    return this.transition({
      id,
      allowedFromStatuses: classificationLeviersJobInFlightStatuses,
      values: { status: ClassificationLeviersJobStatusEnum.FAILED, error },
    });
  }

  private async transition({
    id,
    allowedFromStatuses,
    values,
    tx,
  }: {
    id: string;
    allowedFromStatuses: ClassificationLeviersJobStatus[];
    values: Partial<typeof classificationLeviersJobTable.$inferInsert>;
    tx?: Transaction;
  }): Promise<Result<void, ClassificationLeviersError>> {
    try {
      const transitioned = await (tx ?? this.db)
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
