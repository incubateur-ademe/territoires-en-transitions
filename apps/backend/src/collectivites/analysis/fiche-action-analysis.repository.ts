import { Injectable, Logger } from '@nestjs/common';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { eq, inArray, sql } from 'drizzle-orm';
import { keyBy } from 'es-toolkit';
import { FicheAnalysisStatusErrorEnum } from './analyze-fiches/analyze-fiches.errors';
import {
  FicheAnalysisStatusRepository,
  FicheAnalysisUpsert,
} from './analyze-fiches/fiche-analysis-status.repository';
import { ficheActionAnalysisTable } from './models/fiche-action-analysis.table';
import { FicheAnalysis, ficheAnalysisSchema } from './models/fiche-analysis';

type FicheActionAnalysisRow = typeof ficheActionAnalysisTable.$inferSelect;

const PROCESSED_STATUS = 'processed' satisfies FicheAnalysis['status'];

const FAILED_STATUS = 'failed' satisfies FicheAnalysis['status'];

const isFailedStatus = (status: FicheAnalysis['status']): boolean =>
  status === FAILED_STATUS;

const retryCountOfFirstAnalysis = (status: FicheAnalysis['status']): number =>
  isFailedStatus(status) ? 1 : 0;

const toFicheAnalysis = (row: FicheActionAnalysisRow): FicheAnalysis =>
  ficheAnalysisSchema.parse({
    ficheId: row.ficheId,
    collectiviteId: row.collectiviteId,
    analyzedAt: row.analyzedAt,
    status: row.status,
    fingerprint: row.fingerprint ?? undefined,
    retryCount: isFailedStatus(row.status) ? row.retryCount : undefined,
  });

const toInsertedRow = (
  analysis: FicheAnalysisUpsert
): typeof ficheActionAnalysisTable.$inferInsert => ({
  ficheId: analysis.ficheId,
  collectiviteId: analysis.collectiviteId,
  status: analysis.status,
  fingerprint: analysis.fingerprint ?? null,
  retryCount: retryCountOfFirstAnalysis(analysis.status),
});

const keepLastAnalysisPerFiche = (
  analyses: readonly FicheAnalysisUpsert[]
): FicheAnalysisUpsert[] =>
  Object.values(keyBy(analyses, ({ ficheId }) => ficheId));

type CollectiviteIdByFicheId = ReadonlyMap<number, number>;

const isOfExistingOwnedFiche = (
  collectiviteIdByFicheId: CollectiviteIdByFicheId,
  { ficheId, collectiviteId }: FicheAnalysisUpsert
): boolean => collectiviteIdByFicheId.get(ficheId) === collectiviteId;

const isGivenWithAnotherCollectivite = (
  collectiviteIdByFicheId: CollectiviteIdByFicheId,
  analysis: FicheAnalysisUpsert
): boolean =>
  collectiviteIdByFicheId.has(analysis.ficheId) &&
  !isOfExistingOwnedFiche(collectiviteIdByFicheId, analysis);

const updatedColumnsOnExistingAnalysis = {
  ...buildConflictUpdateColumns(ficheActionAnalysisTable, ['status']),
  fingerprint: sql`case when excluded.status = ${PROCESSED_STATUS} then excluded.fingerprint else ${ficheActionAnalysisTable.fingerprint} end`,
  retryCount: sql`case when excluded.status = ${FAILED_STATUS} then ${ficheActionAnalysisTable.retryCount} + 1 else 0 end`,
  analyzedAt: SQL_CURRENT_TIMESTAMP,
};

@Injectable()
export class FicheActionAnalysisRepository extends FicheAnalysisStatusRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(FicheActionAnalysisRepository.name);

  constructor(private readonly database: DatabaseService) {
    super();
  }

  listAnalyses: FicheAnalysisStatusRepository['listAnalyses'] = async ({
    collectiviteId,
  }) => {
    try {
      const storedAnalyses = await this.db
        .select()
        .from(ficheActionAnalysisTable)
        .where(eq(ficheActionAnalysisTable.collectiviteId, collectiviteId));
      return success(storedAnalyses.map(toFicheAnalysis));
    } catch (error) {
      this.logger.error(
        `Could not list analyses of collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(FicheAnalysisStatusErrorEnum.LIST_FICHE_ANALYSES_ERROR);
    }
  };

  upsertAnalyses: FicheAnalysisStatusRepository['upsertAnalyses'] = async ({
    analyses,
    tx,
  }) => {
    const lastAnalyses = keepLastAnalysisPerFiche(analyses);
    if (lastAnalyses.length === 0) {
      return success(undefined);
    }
    try {
      await (tx ?? this.db).transaction(async (runner) => {
        const ownedAnalyses = await this.keepAnalysesOfExistingOwnedFiches(
          runner,
          lastAnalyses
        );

        if (ownedAnalyses.length === 0) {
          return;
        }

        await runner
          .insert(ficheActionAnalysisTable)
          .values(ownedAnalyses.map(toInsertedRow))
          .onConflictDoUpdate({
            target: ficheActionAnalysisTable.ficheId,
            set: updatedColumnsOnExistingAnalysis,
          });
      });
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Could not upsert analyses of ${
          analyses.length
        } fiches: ${getErrorMessage(error)}`
      );
      return failure(FicheAnalysisStatusErrorEnum.UPSERT_FICHE_ANALYSES_ERROR);
    }
  };

  private async keepAnalysesOfExistingOwnedFiches(
    runner: Transaction,
    analyses: FicheAnalysisUpsert[]
  ): Promise<FicheAnalysisUpsert[]> {
    const collectiviteIdByFicheId = await this.lockExistingFiches(
      runner,
      analyses
    );
    this.warnAboutAnalysesOfAnotherCollectivite(
      collectiviteIdByFicheId,
      analyses
    );
    return analyses.filter((analysis) =>
      isOfExistingOwnedFiche(collectiviteIdByFicheId, analysis)
    );
  }

  private async lockExistingFiches(
    runner: Transaction,
    analyses: FicheAnalysisUpsert[]
  ): Promise<CollectiviteIdByFicheId> {
    const existingFiches = await runner
      .select({
        ficheId: ficheActionTable.id,
        collectiviteId: ficheActionTable.collectiviteId,
      })
      .from(ficheActionTable)
      .where(
        inArray(
          ficheActionTable.id,
          analyses.map(({ ficheId }) => ficheId)
        )
      )
      .for('key share');
    return new Map(
      existingFiches.map((fiche) => [fiche.ficheId, fiche.collectiviteId])
    );
  }

  private warnAboutAnalysesOfAnotherCollectivite(
    collectiviteIdByFicheId: CollectiviteIdByFicheId,
    analyses: FicheAnalysisUpsert[]
  ): void {
    const analysesOfAnotherCollectivite = analyses.filter((analysis) =>
      isGivenWithAnotherCollectivite(collectiviteIdByFicheId, analysis)
    );
    if (analysesOfAnotherCollectivite.length === 0) {
      return;
    }
    this.logger.warn(
      `Skipped analyses given with another collectivite than their fiche's: fiches ${analysesOfAnotherCollectivite
        .map(({ ficheId }) => ficheId)
        .join(', ')}`
    );
  }

  deleteAnalyses: FicheAnalysisStatusRepository['deleteAnalyses'] = async ({
    ficheIds,
    tx,
  }) => {
    if (ficheIds.length === 0) {
      return success(undefined);
    }
    try {
      await (tx ?? this.db)
        .delete(ficheActionAnalysisTable)
        .where(inArray(ficheActionAnalysisTable.ficheId, ficheIds));
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Could not delete analyses of ${
          ficheIds.length
        } fiches: ${getErrorMessage(error)}`
      );
      return failure(FicheAnalysisStatusErrorEnum.DELETE_FICHE_ANALYSES_ERROR);
    }
  };
}
