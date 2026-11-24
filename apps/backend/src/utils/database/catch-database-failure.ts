import { Logger } from '@nestjs/common';
import { failure, Result } from '@tet/backend/utils/result.type';

const logger = new Logger('catchDatabaseFailure');

export const toDatabaseFailure = ({
  error,
  cause,
}: {
  error: string;
  cause?: Error;
}): Result<never, 'DATABASE_ERROR'> =>
  failure('DATABASE_ERROR', cause ?? new Error(error));

export const catchDatabaseFailure = async <Data, ServiceError extends string>(
  operation: () => Promise<Result<Data, ServiceError>>
): Promise<Result<Data, ServiceError | 'DATABASE_ERROR'>> => {
  try {
    return await operation();
  } catch (error) {
    logger.error('Exception imprévue convertie en DATABASE_ERROR:', error);
    return failure(
      'DATABASE_ERROR',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};
