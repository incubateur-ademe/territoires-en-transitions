import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { desc } from 'drizzle-orm';
import { AnalysisRunErrorEnum } from './analyze-fiches/analyze-fiches.errors';
import { AnalysisRunRepository } from './analyze-fiches/analysis-run.repository';
import { analysisRunTable } from './models/analysis-run.table';

@Injectable()
export class AnalysisRunTableRepository extends AnalysisRunRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(AnalysisRunTableRepository.name);

  constructor(private readonly database: DatabaseService) {
    super();
  }

  getLastCompletedRunStart: AnalysisRunRepository['getLastCompletedRunStart'] =
    async () => {
      try {
        const [lastRun] = await this.db
          .select({ startedAt: analysisRunTable.startedAt })
          .from(analysisRunTable)
          .orderBy(desc(analysisRunTable.finishedAt))
          .limit(1);
        return success(lastRun?.startedAt ?? null);
      } catch (error) {
        this.logger.error(
          `Could not read the last analysis run: ${getErrorMessage(error)}`
        );
        return failure(AnalysisRunErrorEnum.GET_LAST_ANALYSIS_RUN_ERROR);
      }
    };

  createCompletedRun: AnalysisRunRepository['createCompletedRun'] = async ({
    startedAt,
    tx,
  }) => {
    try {
      await (tx ?? this.db).insert(analysisRunTable).values({ startedAt });
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Could not record the analysis run started at ${startedAt.toISOString()}: ${getErrorMessage(
          error
        )}`
      );
      return failure(AnalysisRunErrorEnum.CREATE_ANALYSIS_RUN_ERROR);
    }
  };
}
