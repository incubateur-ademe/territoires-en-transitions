import { HttpException } from '@nestjs/common';
import { failure, Result } from '@tet/backend/utils/result.type';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';

export type CalculTrajectoireError =
  | 'UNPROCESSABLE_TRAJECTOIRE'
  | 'SERVER_ERROR'
  | 'DATABASE_ERROR';

export const calculTrajectoireErrorConfig: TrpcErrorHandlerConfig<'UNPROCESSABLE_TRAJECTOIRE'> =
  {
    commonErrors: {
      SERVER_ERROR: { code: 'INTERNAL_SERVER_ERROR', messageFromCause: true },
    },
    specificErrors: {
      UNPROCESSABLE_TRAJECTOIRE: {
        code: 'UNPROCESSABLE_CONTENT',
        messageFromCause: true,
      },
    },
  };

export const toUnprocessableTrajectoireFailure = (
  message: string
): Result<never, 'UNPROCESSABLE_TRAJECTOIRE'> =>
  failure('UNPROCESSABLE_TRAJECTOIRE', new Error(message));

export const toTrajectoireServerFailure = (
  message: string
): Result<never, 'SERVER_ERROR'> => failure('SERVER_ERROR', new Error(message));

export const rethrowHttpExceptionCause = <Data>(
  result: Result<Data, CalculTrajectoireError>
): Result<Data, CalculTrajectoireError> => {
  if (!result.success && result.cause instanceof HttpException) {
    throw result.cause;
  }
  return result;
};
