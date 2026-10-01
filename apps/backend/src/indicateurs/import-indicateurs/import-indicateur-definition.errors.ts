import { HttpException, HttpStatus } from '@nestjs/common';
import type { Result } from '@tet/backend/utils/result.type';

export type ImportIndicateurDefinitionError =
  | 'INVALID_IMPORT'
  | 'INVALID_EXPRESSION'
  | 'IMPORT_CONFLICT'
  | 'DATABASE_ERROR';

/** Keeps the legacy import HTTP contract at its application facade. */
export function getImportResultOrThrow<T>(
  result: Result<T, ImportIndicateurDefinitionError>
): T {
  if (result.success) return result.data;
  const status = {
    INVALID_IMPORT: HttpStatus.BAD_REQUEST,
    INVALID_EXPRESSION: HttpStatus.UNPROCESSABLE_ENTITY,
    IMPORT_CONFLICT: HttpStatus.CONFLICT,
    DATABASE_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
  }[result.error];
  throw new HttpException(result.cause?.message ?? result.error, status);
}
