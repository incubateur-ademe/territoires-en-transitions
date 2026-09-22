import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { type AnalysisProgress } from '../analysis-job.repository';
import {
  AnalysisJobErrorEnum,
  type AnalysisJobError,
} from '../analysis-job.errors';
import { AnalysisJobStatusEnum } from '../models/analysis-job';
import { type AnalysisStatus } from './get-analysis-status.output';

export const toAnalysisStatus = (
  progress: AnalysisProgress
): Result<AnalysisStatus, AnalysisJobError> => {
  const { id, collectiviteId, enjeu, etape, status } = progress;

  switch (status) {
    case AnalysisJobStatusEnum.DONE: {
      const { report } = progress;
      const isMobilisationReportMissing =
        etape !== 'mobilisation' || report === null;
      if (isMobilisationReportMissing) {
        return failure(AnalysisJobErrorEnum.GET_JOB_ERROR);
      }
      return success({ id, collectiviteId, enjeu, etape, status, report });
    }

    case AnalysisJobStatusEnum.FAILED:
      if (!progress.error) {
        return failure(AnalysisJobErrorEnum.GET_JOB_ERROR);
      }
      return success({
        id,
        collectiviteId,
        enjeu,
        etape,
        status,
        error: progress.error,
      });

    case AnalysisJobStatusEnum.PENDING:
    case AnalysisJobStatusEnum.RUNNING:
      return success({
        id,
        collectiviteId,
        enjeu,
        etape,
        status,
        processedBatches: progress.processedBatches,
        totalBatches: progress.totalBatches,
      });
  }
};
