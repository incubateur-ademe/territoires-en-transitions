import { Logger } from '@nestjs/common';
import { failure, Result } from '@tet/backend/utils/result.type';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import {
  describeEstimationError,
  type SolveError,
  type SolveErrorKind,
} from 'ademe-planet';

export type LevierGesError = SolveErrorKind;

export const levierGesErrorConfig: TrpcErrorHandlerConfig<LevierGesError> = {
  specificErrors: {
    invalid_request: { code: 'BAD_REQUEST', messageFromCause: true },
    unknown_territory: { code: 'NOT_FOUND', messageFromCause: true },
    level_not_computed: {
      code: 'UNPROCESSABLE_CONTENT',
      messageFromCause: true,
    },
    missing_data: { code: 'UNPROCESSABLE_CONTENT', messageFromCause: true },
    unreachable_target: {
      code: 'UNPROCESSABLE_CONTENT',
      messageFromCause: true,
    },
    non_monotonic_parameter: {
      code: 'UNPROCESSABLE_CONTENT',
      messageFromCause: true,
    },
    invalid_dataset: { code: 'INTERNAL_SERVER_ERROR' },
  },
};

export const toLevierGesFailure = (
  error: SolveError
): Result<never, LevierGesError> => {
  if (error.kind === 'invalid_dataset') {
    return failure(error.kind);
  }
  return failure(error.kind, new Error(describeEstimationError(error)));
};

export const logInvalidDataset = (logger: Logger, error: SolveError): void => {
  if (error.kind === 'invalid_dataset') {
    logger.error(
      `Invalid dataset ${error.dataset} (${error.reason}): ${error.detail}`
    );
  }
};
