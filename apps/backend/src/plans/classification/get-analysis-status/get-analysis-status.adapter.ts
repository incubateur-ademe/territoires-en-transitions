import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { type ClassificationProgress } from '../classification-volets-job.repository';
import {
  ClassificationVoletsErrorEnum,
  type ClassificationVoletsError,
} from '../classification-volets.errors';
import { ClassificationVoletsJobStatusEnum } from '../models/classification-volets-job';
import { type AnalysisStatus } from './get-analysis-status.output';

export const toAnalysisStatus = (
  progress: ClassificationProgress
): Result<AnalysisStatus, ClassificationVoletsError> => {
  const { id, collectiviteId, enjeu, etape, status } = progress;

  switch (status) {
    case ClassificationVoletsJobStatusEnum.DONE: {
      const { draft } = progress;
      if (etape !== 'mobilisation' || draft === null) {
        return failure(ClassificationVoletsErrorEnum.GET_JOB_ERROR);
      }
      return success({ id, collectiviteId, enjeu, etape, status, draft });
    }

    case ClassificationVoletsJobStatusEnum.FAILED:
      if (!progress.error) {
        return failure(ClassificationVoletsErrorEnum.GET_JOB_ERROR);
      }
      return success({
        id,
        collectiviteId,
        enjeu,
        etape,
        status,
        error: progress.error,
      });

    case ClassificationVoletsJobStatusEnum.PENDING:
    case ClassificationVoletsJobStatusEnum.RUNNING:
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
