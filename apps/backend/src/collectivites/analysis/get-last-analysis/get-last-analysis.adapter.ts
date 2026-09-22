import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { type AnalysisProgress } from '../analysis-job.repository';
import {
  AnalysisJobErrorEnum,
  type AnalysisJobError,
} from '../analysis-job.errors';
import { AnalysisJobStatusEnum } from '../models/analysis-job';
import { type AnalysisStatus } from './get-last-analysis.output';

export const toAnalysisStatus = (
  progress: AnalysisProgress
): Result<AnalysisStatus, AnalysisJobError> => {
  const { id, collectiviteId, enjeu, etape, status, createdAt, modifiedAt } =
    progress;
  const identity = {
    id,
    collectiviteId,
    enjeu,
    etape,
    createdAt,
    modifiedAt,
  };

  switch (status) {
    case AnalysisJobStatusEnum.DONE: {
      const { report } = progress;
      const isMobilisationReportMissing =
        etape !== 'mobilisation' || report === null;
      if (isMobilisationReportMissing) {
        return failure(AnalysisJobErrorEnum.GET_JOB_ERROR);
      }
      return success({ ...identity, etape, status, report });
    }

    case AnalysisJobStatusEnum.FAILED:
      if (!progress.error) {
        return failure(AnalysisJobErrorEnum.GET_JOB_ERROR);
      }
      return success({ ...identity, status, error: progress.error });

    case AnalysisJobStatusEnum.PENDING:
    case AnalysisJobStatusEnum.RUNNING:
      return success({
        ...identity,
        status,
        processedBatches: progress.processedBatches,
        totalBatches: progress.totalBatches,
      });
  }
};
