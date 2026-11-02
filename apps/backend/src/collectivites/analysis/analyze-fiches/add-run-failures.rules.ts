import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ClassifyBatchFailure } from '../classify-batch/classify-batch.errors';
import { CalculateCollectiviteMobilisationError } from '../score-mobilisation/score-mobilisation.errors';

export type RunFailure =
  | {
      readonly kind: 'fiche';
      readonly ficheId: number;
      readonly collectiviteId: number;
      readonly cause: ClassifyBatchFailure;
    }
  | {
      readonly kind: 'mobilisation';
      readonly collectiviteId: number;
      readonly cause: CalculateCollectiviteMobilisationError;
    };

export type RunAborted = {
  readonly kind: 'failure_threshold_reached';
  readonly failures: readonly RunFailure[];
};

type AddRunFailures = (
  failures: readonly RunFailure[],
  newFailures: readonly RunFailure[]
) => Result<RunFailure[], RunAborted>;

export const RUN_FAILURE_THRESHOLD = 10;

export const addRunFailures: AddRunFailures = (failures, newFailures) => {
  const allFailures = [...failures, ...newFailures];
  if (allFailures.length >= RUN_FAILURE_THRESHOLD) {
    return failure({
      kind: 'failure_threshold_reached',
      failures: allFailures,
    });
  }
  return success(allFailures);
};
