import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { eq, inArray, sql } from 'drizzle-orm';
import { FicheAnalysisStatusErrorEnum } from './analyze-fiches/analyze-fiches.errors';
import {
  FicheAnalysisStatusRepository,
  FicheAnalysisUpsert,
} from './analyze-fiches/fiche-analysis-status.repository';
import { ficheActionAnalysisTable } from './models/fiche-action-analysis.table';
import { FicheAnalysis, ficheAnalysisSchema } from './models/fiche-analysis';

type FicheActionAnalysisRow = typeof ficheActionAnalysisTable.$inferSelect;

const toFicheAnalysis = (row: FicheActionAnalysisRow): FicheAnalysis =>
  ficheAnalysisSchema.parse({
    ficheId: row.ficheId,
    collectiviteId: row.collectiviteId,
    analyzedAt: row.analyzedAt,
    status: row.status,
    fingerprint: row.fingerprint ?? undefined,
    retryCount: row.status === 'failed' ? row.retryCount : undefined,
  });

const toInsertedRow = (
  analysis: FicheAnalysisUpsert
): typeof ficheActionAnalysisTable.$inferInsert => ({
  ficheId: analysis.ficheId,
  collectiviteId: analysis.collectiviteId,
  status: analysis.status,
  fingerprint: analysis.fingerprint ?? null,
  retryCount: analysis.status === 'failed' ? 1 : 0,
});

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
      const rows = await this.db
        .select()
        .from(ficheActionAnalysisTable)
        .where(eq(ficheActionAnalysisTable.collectiviteId, collectiviteId))
        .orderBy(ficheActionAnalysisTable.ficheId);
      return success(rows.map(toFicheAnalysis));
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
    if (analyses.length === 0) {
      return success(undefined);
    }
    try {
      await (tx ?? this.db)
        .insert(ficheActionAnalysisTable)
        .values(analyses.map(toInsertedRow))
        .onConflictDoUpdate({
          target: ficheActionAnalysisTable.ficheId,
          set: {
            ...buildConflictUpdateColumns(ficheActionAnalysisTable, ['status']),
            fingerprint: sql`case when excluded.status = 'processed' then excluded.fingerprint else ${ficheActionAnalysisTable.fingerprint} end`,
            retryCount: sql`case when excluded.status = 'failed' then ${ficheActionAnalysisTable.retryCount} + 1 else 0 end`,
            analyzedAt: SQL_CURRENT_TIMESTAMP,
          },
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
