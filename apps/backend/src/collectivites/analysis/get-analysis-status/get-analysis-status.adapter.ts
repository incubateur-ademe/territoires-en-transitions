import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { type ClassificationProgress } from '../analysis-job.repository';
import {
  AnalysisJobErrorEnum,
  type AnalysisJobError,
} from '../analysis-job.errors';
import { AnalysisJobStatusEnum } from '../models/analysis-job';
import { type AnalysisStatus } from './get-analysis-status.output';

export const toAnalysisStatus = (
  progress: ClassificationProgress
): Result<AnalysisStatus, AnalysisJobError> => {
  const { id, collectiviteId, enjeu, etape, status } = progress;

  switch (status) {
    case AnalysisJobStatusEnum.DONE: {
      const { draft } = progress;
      if (etape !== 'mobilisation' || draft === null) {
        return failure(AnalysisJobErrorEnum.GET_JOB_ERROR);
      }
      return success({ id, collectiviteId, enjeu, etape, status, draft });
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
