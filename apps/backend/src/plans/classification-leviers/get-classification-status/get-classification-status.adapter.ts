import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { type ClassificationProgress } from '../classification-leviers-job.repository';
import {
  ClassificationLeviersErrorEnum,
  type ClassificationLeviersError,
} from '../classification-leviers.errors';
import { ClassificationLeviersJobStatusEnum } from '../models/classification-leviers-job';
import { type ClassificationStatus } from './get-classification-status.output';

export const toClassificationStatus = (
  progress: ClassificationProgress
): Result<ClassificationStatus, ClassificationLeviersError> => {
  const { id, planId, status } = progress;

  switch (status) {
    case ClassificationLeviersJobStatusEnum.DONE:
      if (!progress.draft) {
        return failure(ClassificationLeviersErrorEnum.GET_JOB_ERROR);
      }
      return success({ id, planId, status, draft: progress.draft });

    case ClassificationLeviersJobStatusEnum.FAILED:
      if (!progress.error) {
        return failure(ClassificationLeviersErrorEnum.GET_JOB_ERROR);
      }
      return success({ id, planId, status, error: progress.error });

    case ClassificationLeviersJobStatusEnum.PENDING:
    case ClassificationLeviersJobStatusEnum.RUNNING:
      return success({
        id,
        planId,
        status,
        processedBatches: progress.processedBatches,
        totalBatches: progress.totalBatches,
      });
  }
};
