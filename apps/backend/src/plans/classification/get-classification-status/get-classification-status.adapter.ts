import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { type ClassificationProgress } from '../classification-volets-job.repository';
import {
  ClassificationVoletsErrorEnum,
  type ClassificationVoletsError,
} from '../classification-volets.errors';
import { ClassificationVoletsJobStatusEnum } from '../models/classification-volets-job';
import { type ClassificationStatus } from './get-classification-status.output';

export const toClassificationStatus = (
  progress: ClassificationProgress
): Result<ClassificationStatus, ClassificationVoletsError> => {
  const { id, planId, enjeu, status } = progress;

  switch (status) {
    case ClassificationVoletsJobStatusEnum.DONE:
      if (!progress.draft) {
        return failure(ClassificationVoletsErrorEnum.GET_JOB_ERROR);
      }
      return success({ id, planId, enjeu, status, draft: progress.draft });

    case ClassificationVoletsJobStatusEnum.FAILED:
      if (!progress.error) {
        return failure(ClassificationVoletsErrorEnum.GET_JOB_ERROR);
      }
      return success({ id, planId, enjeu, status, error: progress.error });

    case ClassificationVoletsJobStatusEnum.PENDING:
    case ClassificationVoletsJobStatusEnum.RUNNING:
      return success({
        id,
        planId,
        enjeu,
        status,
        processedBatches: progress.processedBatches,
        totalBatches: progress.totalBatches,
      });
  }
};
