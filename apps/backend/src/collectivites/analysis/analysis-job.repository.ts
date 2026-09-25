import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Enjeu, AnalysisStep } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import {
  AnalysisJobErrorEnum,
  type AnalysisJobError,
} from './analysis-job.errors';
import { ClassificationReport } from './models/classification-report';
import {
  AnalysisJob,
  analysisJobInFlightStatuses,
  AnalysisJobStatus,
  AnalysisJobStatusEnum,
  IN_FLIGHT_LEASE_MS,
} from './models/analysis-job';
import {
  analysisJobTable,
  inFlightStatusPredicate,
} from './models/analysis-job.table';

const STALE_JOB_ERROR_MESSAGE = `Job abandonné : aucune progression depuis plus de ${
  IN_FLIGHT_LEASE_MS / 60_000
} minutes`;

const progressProjection = {
  id: analysisJobTable.id,
  collectiviteId: analysisJobTable.collectiviteId,
  enjeu: analysisJobTable.enjeu,
  etape: analysisJobTable.etape,
  status: analysisJobTable.status,
  processedBatches: analysisJobTable.processedBatches,
  totalBatches: analysisJobTable.totalBatches,
  report: analysisJobTable.report,
  error: analysisJobTable.error,
  createdAt: sqlToDateTimeISO(analysisJobTable.createdAt),
  modifiedAt: sqlToDateTimeISO(analysisJobTable.modifiedAt),
};

export type AnalysisProgress = {
  [K in keyof typeof progressProjection]: AnalysisJob[K];
};

type CreateAnalysisJobInput = {
  collectiviteId: number;
  enjeu: Enjeu;
  etape: AnalysisStep;
  createdBy: string;
};

@Injectable()
export class AnalysisJobRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(AnalysisJobRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async createUnlessInFlight(
    input: CreateAnalysisJobInput
  ): Promise<Result<AnalysisJob, AnalysisJobError>> {
    try {
      const job = await this.insertUnlessInFlight(input);
      if (job) {
        return success(job);
      }

      const hasExpiredStaleJob = await this.expireStaleInFlight(input);
      if (!hasExpiredStaleJob) {
        return failure(AnalysisJobErrorEnum.IN_FLIGHT_JOB_EXISTS);
      }

      const jobAfterExpiry = await this.insertUnlessInFlight(input);
      if (!jobAfterExpiry) {
        return failure(AnalysisJobErrorEnum.IN_FLIGHT_JOB_EXISTS);
      }

      return success(jobAfterExpiry);
    } catch (error) {
      this.logger.error(`Création du job d'analyse: ${getErrorMessage(error)}`);
      return failure(AnalysisJobErrorEnum.CREATE_JOB_ERROR);
    }
  }

  private async insertUnlessInFlight(
    input: CreateAnalysisJobInput
  ): Promise<AnalysisJob | undefined> {
    const [job] = await this.db
      .insert(analysisJobTable)
      .values({
        collectiviteId: input.collectiviteId,
        enjeu: input.enjeu,
        etape: input.etape,
        createdBy: input.createdBy,
        status: AnalysisJobStatusEnum.PENDING,
      })
      .onConflictDoNothing({
        target: [analysisJobTable.collectiviteId, analysisJobTable.enjeu],
        where: inFlightStatusPredicate,
      })
      .returning();

    return job;
  }

  private async expireStaleInFlight({
    collectiviteId,
    enjeu,
  }: CreateAnalysisJobInput): Promise<boolean> {
    const expiredJobs = await this.db
      .update(analysisJobTable)
      .set({
        status: AnalysisJobStatusEnum.FAILED,
        error: STALE_JOB_ERROR_MESSAGE,
        modifiedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(analysisJobTable.collectiviteId, collectiviteId),
          eq(analysisJobTable.enjeu, enjeu),
          inArray(analysisJobTable.status, analysisJobInFlightStatuses),
          lt(
            analysisJobTable.modifiedAt,
            new Date(Date.now() - IN_FLIGHT_LEASE_MS).toISOString()
          )
        )
      )
      .returning({ id: analysisJobTable.id });

    return expiredJobs.length > 0;
  }

  async getById(id: string): Promise<Result<AnalysisJob, AnalysisJobError>> {
    try {
      const [job] = await this.db
        .select()
        .from(analysisJobTable)
        .where(eq(analysisJobTable.id, id))
        .limit(1);

      if (!job) {
        return failure(AnalysisJobErrorEnum.JOB_NOT_FOUND);
      }

      return success(job);
    } catch (error) {
      this.logger.error(
        `Lecture du job d'analyse ${id}: ${getErrorMessage(error)}`
      );
      return failure(AnalysisJobErrorEnum.GET_JOB_ERROR);
    }
  }

  async getLastProgressOf({
    collectiviteId,
    enjeu,
  }: {
    collectiviteId: number;
    enjeu: Enjeu;
  }): Promise<Result<AnalysisProgress | undefined, AnalysisJobError>> {
    try {
      const [progress] = await this.db
        .select(progressProjection)
        .from(analysisJobTable)
        .where(
          and(
            eq(analysisJobTable.collectiviteId, collectiviteId),
            eq(analysisJobTable.enjeu, enjeu)
          )
        )
        .orderBy(desc(analysisJobTable.createdAt))
        .limit(1);

      return success(progress);
    } catch (error) {
      this.logger.error(
        `Lecture de la dernière analyse de la collectivité ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(AnalysisJobErrorEnum.GET_JOB_ERROR);
    }
  }

  async markRunning(
    id: string,
    totalBatches: number
  ): Promise<Result<void, AnalysisJobError>> {
    return this.transition({
      id,
      allowedFromStatuses: [AnalysisJobStatusEnum.PENDING],
      values: {
        status: AnalysisJobStatusEnum.RUNNING,
        totalBatches,
      },
    });
  }

  async startMobilisationPhase(
    id: string,
    totalBatches: number
  ): Promise<Result<void, AnalysisJobError>> {
    return this.transition({
      id,
      allowedFromStatuses: [AnalysisJobStatusEnum.RUNNING],
      values: { etape: 'mobilisation', processedBatches: 0, totalBatches },
    });
  }

  async countProcessedBatch(id: string): Promise<void> {
    try {
      await this.db
        .update(analysisJobTable)
        .set({
          processedBatches: sql`${analysisJobTable.processedBatches} + 1`,
          modifiedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(analysisJobTable.id, id),
            eq(analysisJobTable.status, AnalysisJobStatusEnum.RUNNING)
          )
        );
    } catch (error) {
      this.logger.error(
        `Progression du job d'analyse ${id}: ${getErrorMessage(error)}`
      );
    }
  }

  async recordProcessedBatches(
    id: string,
    processedBatches: number
  ): Promise<void> {
    try {
      await this.db
        .update(analysisJobTable)
        .set({ processedBatches, modifiedAt: new Date().toISOString() })
        .where(
          and(
            eq(analysisJobTable.id, id),
            eq(analysisJobTable.status, AnalysisJobStatusEnum.RUNNING),
            lt(analysisJobTable.processedBatches, processedBatches)
          )
        );
    } catch (error) {
      this.logger.error(
        `Progression du job d'analyse ${id}: ${getErrorMessage(error)}`
      );
    }
  }

  async addTokenUsage(id: string, spentTokens: TokenUsage): Promise<void> {
    const toAccumulated = (field: keyof TokenUsage) =>
      sql`coalesce((${analysisJobTable.tokenUsage} ->> ${field})::bigint, 0) + ${spentTokens[field]}`;

    try {
      await this.db
        .update(analysisJobTable)
        .set({
          tokenUsage: sql`jsonb_build_object(
            'promptTokens', ${toAccumulated('promptTokens')},
            'cachedTokens', ${toAccumulated('cachedTokens')},
            'candidatesTokens', ${toAccumulated('candidatesTokens')},
            'thoughtsTokens', ${toAccumulated('thoughtsTokens')},
            'totalTokens', ${toAccumulated('totalTokens')}
          )`,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(analysisJobTable.id, id));
    } catch (error) {
      this.logger.error(
        `Jetons consommés par le job ${id}: ${getErrorMessage(error)}`
      );
    }
  }

  async recordClassificationReport({
    id,
    report,
    tx,
  }: {
    id: string;
    report: ClassificationReport;
    tx?: Transaction;
  }): Promise<Result<void, AnalysisJobError>> {
    return this.transition({
      id,
      allowedFromStatuses: [AnalysisJobStatusEnum.RUNNING],
      values: { report },
      tx,
    });
  }

  async markDone({
    id,
    tx,
  }: {
    id: string;
    tx?: Transaction;
  }): Promise<Result<void, AnalysisJobError>> {
    return this.transition({
      id,
      allowedFromStatuses: [AnalysisJobStatusEnum.RUNNING],
      values: { status: AnalysisJobStatusEnum.DONE },
      tx,
    });
  }

  async markFailed(
    id: string,
    error: string
  ): Promise<Result<void, AnalysisJobError>> {
    return this.transition({
      id,
      allowedFromStatuses: analysisJobInFlightStatuses,
      values: { status: AnalysisJobStatusEnum.FAILED, error },
    });
  }

  private async transition({
    id,
    allowedFromStatuses,
    values,
    tx,
  }: {
    id: string;
    allowedFromStatuses: AnalysisJobStatus[];
    values: Partial<typeof analysisJobTable.$inferInsert>;
    tx?: Transaction;
  }): Promise<Result<void, AnalysisJobError>> {
    try {
      const transitioned = await (tx ?? this.db)
        .update(analysisJobTable)
        .set({ ...values, modifiedAt: new Date().toISOString() })
        .where(
          and(
            eq(analysisJobTable.id, id),
            inArray(analysisJobTable.status, allowedFromStatuses)
          )
        )
        .returning({ id: analysisJobTable.id });

      if (transitioned.length === 0) {
        return failure(AnalysisJobErrorEnum.JOB_TRANSITION_REFUSED);
      }

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Mise à jour du job d'analyse ${id}: ${getErrorMessage(error)}`
      );
      return failure(AnalysisJobErrorEnum.UPDATE_JOB_ERROR);
    }
  }
}
