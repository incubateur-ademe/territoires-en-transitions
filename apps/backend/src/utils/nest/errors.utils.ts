import { DatabaseError } from 'pg';

export function getErrorCode(error: unknown) {
  if (isErrorWithCause(error)) {
    return error.cause.code;
  }

  return (error as any).code;
}

type ErrorWithCause = Error & {
  cause: DatabaseError;
};

export function isErrorWithCause(error: unknown): error is ErrorWithCause {
  return (
    error instanceof Error &&
    'cause' in error &&
    error.cause instanceof DatabaseError
  );
}
