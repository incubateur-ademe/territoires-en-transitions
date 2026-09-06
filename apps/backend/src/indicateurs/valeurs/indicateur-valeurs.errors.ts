import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { isFailedResult } from '@tet/backend/utils/transaction/transaction-manager.service';
import { UserIndicateurValeurNotAllowedException } from './user-indicateur-valeur.errors';

export type IndicateurValeursError =
  | 'UNAUTHORIZED'
  | 'INVALID_VALUE'
  | 'USER_VALUE_NOT_ALLOWED'
  | 'DATABASE_ERROR';

/** Preserve the legacy cause while application services expose typed results. */
export async function captureIndicateurValeursResult<T>(
  operation: () => Promise<T>
): Promise<Result<T, IndicateurValeursError>> {
  try {
    return success(await operation());
  } catch (error) {
    if (isFailedResult<IndicateurValeursError>(error)) return error;
    const code =
      error instanceof UserIndicateurValeurNotAllowedException
        ? 'USER_VALUE_NOT_ALLOWED'
        : error instanceof ForbiddenException
        ? 'UNAUTHORIZED'
        : error instanceof BadRequestException
        ? 'INVALID_VALUE'
        : 'DATABASE_ERROR';
    return failure(
      code,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/** Compatibility boundary for callers still using the historical throwing API. */
export function getIndicateurValeursDataOrThrow<T>(
  result: Result<T, IndicateurValeursError>
): T {
  if (!result.success) throw result.cause ?? result.error;
  return result.data;
}
