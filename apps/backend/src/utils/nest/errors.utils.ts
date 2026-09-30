import { PgIntegrityConstraintViolation } from '@tet/backend/utils/postgresql-error-codes.enum';

export function getErrorCode(error: unknown) {
  if (isErrorWithCause(error)) {
    return error.cause.code;
  }

  return (error as any).code;
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
