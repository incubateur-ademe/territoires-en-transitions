import { InternalServerErrorException } from '@nestjs/common';
import { Result } from '@tet/backend/utils/result.type';

export function getIndicateurDataOrThrow<Data>(
  result: Result<Data, 'DATABASE_ERROR'>
): Data {
  if (!result.success) {
    throw new InternalServerErrorException(
      result.cause?.message ?? result.error,
      { cause: result.cause }
    );
  }
  return result.data;
}
