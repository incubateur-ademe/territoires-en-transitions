import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Result } from '@tet/backend/utils/result.type';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';

export type ReadValeursError = Extract<
  CommonError,
  'UNAUTHORIZED' | 'NOT_FOUND' | 'DATABASE_ERROR'
>;

export const readValeursErrorConfig: TrpcErrorHandlerConfig<never> = {
  commonErrors: {
    UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
    NOT_FOUND: { code: 'NOT_FOUND', messageFromCause: true },
    DATABASE_ERROR: { code: 'INTERNAL_SERVER_ERROR', messageFromCause: true },
  },
};

export const getReadValeursDataOrThrow = <Data>(
  result: Result<Data, ReadValeursError>
): Data => {
  if (result.success) return result.data;
  const message = result.cause?.message ?? result.error;
  if (result.error === 'UNAUTHORIZED') throw new ForbiddenException(message);
  if (result.error === 'NOT_FOUND') throw new NotFoundException(message);
  throw new InternalServerErrorException(message, { cause: result.cause });
};
