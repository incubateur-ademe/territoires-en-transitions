import {
  BadRequestException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { isFailedResult } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import { match } from 'ts-pattern';
import { UserIndicateurValeurNotAllowedException } from './write-indicateur-valeurs/user-indicateur-valeur.errors';

export type IndicateurValeursError =
  | 'UNAUTHORIZED'
  | 'INVALID_VALUE'
  | 'USER_VALUE_NOT_ALLOWED'
  | 'DATABASE_ERROR';

export const indicateurValeursErrorConfig: TrpcErrorHandlerConfig<
  Extract<IndicateurValeursError, 'INVALID_VALUE' | 'USER_VALUE_NOT_ALLOWED'>
> = {
  commonErrors: {
    UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
  },
  specificErrors: {
    INVALID_VALUE: { code: 'BAD_REQUEST', messageFromCause: true },
    USER_VALUE_NOT_ALLOWED: { code: 'BAD_REQUEST', messageFromCause: true },
  },
};

export const toCommonError = (error: IndicateurValeursError): CommonError =>
  match(error)
    .with('UNAUTHORIZED', () => 'UNAUTHORIZED' as const)
    .with('DATABASE_ERROR', () => 'DATABASE_ERROR' as const)
    .with(
      'INVALID_VALUE',
      'USER_VALUE_NOT_ALLOWED',
      () => 'SERVER_ERROR' as const
    )
    .exhaustive();

export const toCommonFailure = ({
  error,
  cause,
}: Extract<Result<never, IndicateurValeursError>, { success: false }>): Result<
  never,
  CommonError
> => failure(toCommonError(error), cause);

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

export async function captureIndicateurValeursResultOf<Data>(
  operation: () => Promise<Result<Data, IndicateurValeursError>>
): Promise<Result<Data, IndicateurValeursError>> {
  const captured = await captureIndicateurValeursResult(operation);
  return captured.success ? captured.data : captured;
}

/** Compatibility boundary for callers still using the historical throwing API. */
export function getIndicateurValeursDataOrThrow<T>(
  result: Result<T, IndicateurValeursError>
): T {
  if (result.success) return result.data;
  throw toThrowable(result);
}

function toThrowable({
  error,
  cause,
}: {
  error: IndicateurValeursError;
  cause?: Error;
}): unknown {
  if (cause instanceof HttpException) return cause;
  return match(error)
    .with(
      'UNAUTHORIZED',
      () => new ForbiddenException(cause?.message ?? error, { cause })
    )
    .with(
      'INVALID_VALUE',
      () => new BadRequestException(cause?.message ?? error, { cause })
    )
    .with('USER_VALUE_NOT_ALLOWED', 'DATABASE_ERROR', () => cause ?? error)
    .exhaustive();
}
