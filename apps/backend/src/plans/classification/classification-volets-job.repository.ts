import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray, lt } from 'drizzle-orm';
import {
  ClassificationVoletsErrorEnum,
  type ClassificationVoletsError,
} from './classification-volets.errors';
import { ClassificationDraft } from './models/classification-draft';
import {
  ClassificationVoletsJob,
  classificationVoletsJobInFlightStatuses,
  ClassificationVoletsJobStatus,
  ClassificationVoletsJobStatusEnum,
  IN_FLIGHT_LEASE_MS,
} from './models/classification-volets-job';
import {
  classificationVoletsJobTable,
  inFlightStatusPredicate,
} from './models/classification-volets-job.table';

const STALE_JOB_ERROR_MESSAGE =
  'Job abandonné : aucune progression depuis plus de trente minutes';

const progressProjection = {
  id: classificationVoletsJobTable.id,
  collectiviteId: classificationVoletsJobTable.collectiviteId,
  planId: classificationVoletsJobTable.planId,
  status: classificationVoletsJobTable.status,
  processedBatches: classificationVoletsJobTable.processedBatches,
  totalBatches: classificationVoletsJobTable.totalBatches,
  draft: classificationVoletsJobTable.draft,
  error: classificationVoletsJobTable.error,
};

export type ClassificationProgress = {
  [K in keyof typeof progressProjection]: ClassificationVoletsJob[K];
};

export type CreateClassificationJobInput = {
  collectiviteId: number;
  planId: number;
  createdBy: string;
};

@Injectable()
export class ClassificationVoletsJobRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(
    ClassificationVoletsJobRepository.name
  );

  constructor(private readonly database: DatabaseService) {}

  async createUnlessInFlight(
    input: CreateClassificationJobInput
  ): Promise<Result<ClassificationVoletsJob, ClassificationVoletsError>> {
    try {
      const job = await this.insertUnlessInFlight(input);
      if (job) {
        return success(job);
      }

      const hasExpiredStaleJob = await this.expireStaleInFlight(input.planId);
      if (!hasExpiredStaleJob) {
        return failure(ClassificationVoletsErrorEnum.IN_FLIGHT_JOB_EXISTS);
      }

      const jobAfterExpiry = await this.insertUnlessInFlight(input);
      if (!jobAfterExpiry) {
        return failure(ClassificationVoletsErrorEnum.IN_FLIGHT_JOB_EXISTS);
      }

      return success(jobAfterExpiry);
    } catch (error) {
      this.logger.error(
        `Création du job de classification: ${getErrorMessage(error)}`
      );
      return failure(ClassificationVoletsErrorEnum.CREATE_JOB_ERROR);
    }
  }

  private async insertUnlessInFlight(
    input: CreateClassificationJobInput
  ): Promise<ClassificationVoletsJob | undefined> {
    const [job] = await this.db
      .insert(classificationVoletsJobTable)
      .values({
        collectiviteId: input.collectiviteId,
        planId: input.planId,
        createdBy: input.createdBy,
        status: ClassificationVoletsJobStatusEnum.PENDING,
      })
      .onConflictDoNothing({
        target: classificationVoletsJobTable.planId,
        where: inFlightStatusPredicate,
      })
      .returning();

    return job;
  }

  private async expireStaleInFlight(planId: number): Promise<boolean> {
    const expiredJobs = await this.db
      .update(classificationVoletsJobTable)
      .set({
        status: ClassificationVoletsJobStatusEnum.FAILED,
        error: STALE_JOB_ERROR_MESSAGE,
        modifiedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(classificationVoletsJobTable.planId, planId),
          inArray(
            classificationVoletsJobTable.status,
            classificationVoletsJobInFlightStatuses
          ),
          lt(
            classificationVoletsJobTable.modifiedAt,
            new Date(Date.now() - IN_FLIGHT_LEASE_MS).toISOString()
          )
        )
      )
      .returning({ id: classificationVoletsJobTable.id });

    return expiredJobs.length > 0;
  }

  async getById(
    id: string
  ): Promise<Result<ClassificationVoletsJob, ClassificationVoletsError>> {
    try {
      const [job] = await this.db
        .select()
        .from(classificationVoletsJobTable)
        .where(eq(classificationVoletsJobTable.id, id))
        .limit(1);

      if (!job) {
        return failure(ClassificationVoletsErrorEnum.JOB_NOT_FOUND);
      }

      return success(job);
    } catch (error) {
      this.logger.error(
        `Lecture du job de classification ${id}: ${getErrorMessage(error)}`
      );
      return failure(ClassificationVoletsErrorEnum.GET_JOB_ERROR);
    }
  }

  async getProgressById(
    id: string
  ): Promise<Result<ClassificationProgress, ClassificationVoletsError>> {
    try {
      const [progress] = await this.db
        .select(progressProjection)
        .from(classificationVoletsJobTable)
        .where(eq(classificationVoletsJobTable.id, id))
        .limit(1);

      if (!progress) {
        return failure(ClassificationVoletsErrorEnum.JOB_NOT_FOUND);
      }

      return success(progress);
    } catch (error) {
      this.logger.error(
        `Lecture de la progression du job ${id}: ${getErrorMessage(error)}`
      );
      return failure(ClassificationVoletsErrorEnum.GET_JOB_ERROR);
    }
  }

  async markRunning(
    id: string,
    totalBatches: number
  ): Promise<Result<void, ClassificationVoletsError>> {
    return this.transition({
      id,
      allowedFromStatuses: [ClassificationVoletsJobStatusEnum.PENDING],
      values: {
        status: ClassificationVoletsJobStatusEnum.RUNNING,
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
        .update(classificationVoletsJobTable)
        .set({ processedBatches, modifiedAt: new Date().toISOString() })
        .where(
          and(
            eq(classificationVoletsJobTable.id, id),
            eq(
              classificationVoletsJobTable.status,
              ClassificationVoletsJobStatusEnum.RUNNING
            ),
            lt(classificationVoletsJobTable.processedBatches, processedBatches)
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
  }): Promise<Result<void, ClassificationVoletsError>> {
    return this.transition({
      id,
      allowedFromStatuses: [ClassificationVoletsJobStatusEnum.RUNNING],
      values: {
        status: ClassificationVoletsJobStatusEnum.DONE,
        draft,
        tokenUsage,
      },
      tx,
    });
  }

  async markFailed(
    id: string,
    error: string
  ): Promise<Result<void, ClassificationVoletsError>> {
    return this.transition({
      id,
      allowedFromStatuses: classificationVoletsJobInFlightStatuses,
      values: { status: ClassificationVoletsJobStatusEnum.FAILED, error },
    });
  }

  private async transition({
    id,
    allowedFromStatuses,
    values,
    tx,
  }: {
    id: string;
    allowedFromStatuses: ClassificationVoletsJobStatus[];
    values: Partial<typeof classificationVoletsJobTable.$inferInsert>;
    tx?: Transaction;
  }): Promise<Result<void, ClassificationVoletsError>> {
    try {
      const transitioned = await (tx ?? this.db)
        .update(classificationVoletsJobTable)
        .set({ ...values, modifiedAt: new Date().toISOString() })
        .where(
          and(
            eq(classificationVoletsJobTable.id, id),
            inArray(classificationVoletsJobTable.status, allowedFromStatuses)
          )
        )
        .returning({ id: classificationVoletsJobTable.id });

      if (transitioned.length === 0) {
        return failure(ClassificationVoletsErrorEnum.JOB_TRANSITION_REFUSED);
      }

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Mise à jour du job de classification ${id}: ${getErrorMessage(error)}`
      );
      return failure(ClassificationVoletsErrorEnum.UPDATE_JOB_ERROR);
    }
  }
}
