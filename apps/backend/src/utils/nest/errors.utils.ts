import { HttpException } from '@nestjs/common';
import { PgIntegrityConstraintViolation } from '@tet/backend/utils/postgresql-error-codes.enum';

export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof HttpException && error.errorCode !== undefined) {
    return error.errorCode;
  }

  if (isErrorWithCause(error) && typeof error.cause.code === 'string') {
    return error.cause.code;
  }

  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : undefined;
}

// It's not always a database error
type ErrorWithCause = Error & {
  cause: Error & {
    detail?: string;
    code?: string;
    constraint?: string;
  };
};

export function isErrorWithCause(error: unknown): error is ErrorWithCause {
  return (
    error instanceof Error && 'cause' in error && error.cause instanceof Error
  );
}

export function isUniqueViolation(error: unknown): error is ErrorWithCause {
  return (
    isErrorWithCause(error) &&
    error.cause.code === PgIntegrityConstraintViolation.UniqueViolation
  );
}
