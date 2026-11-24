import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { isFailedResult } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';
import { match } from 'ts-pattern';
import { UserIndicateurValeurNotAllowedException } from './write-indicateur-valeurs/user-indicateur-valeur.errors';

const indicateurValeursErrors = [
  'UNAUTHORIZED',
  'INVALID_VALUE',
  'INDICATEUR_NOT_AVAILABLE',
  'PERIODICITE_MISMATCH',
  'USER_VALUE_NOT_ALLOWED',
  'DATABASE_ERROR',
] as const;

export type IndicateurValeursError = (typeof indicateurValeursErrors)[number];

export const isIndicateurValeursError = (
  error: unknown
): error is IndicateurValeursError =>
  indicateurValeursErrors.some((code) => code === error);

export const indicateurValeursErrorConfig: TrpcErrorHandlerConfig<
  Extract<
    IndicateurValeursError,
    | 'INVALID_VALUE'
    | 'INDICATEUR_NOT_AVAILABLE'
    | 'PERIODICITE_MISMATCH'
    | 'USER_VALUE_NOT_ALLOWED'
  >
> = {
  commonErrors: {
    UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
  },
  specificErrors: {
    INVALID_VALUE: { code: 'BAD_REQUEST', messageFromCause: true },
    INDICATEUR_NOT_AVAILABLE: { code: 'BAD_REQUEST', messageFromCause: true },
    PERIODICITE_MISMATCH: { code: 'BAD_REQUEST', messageFromCause: true },
    USER_VALUE_NOT_ALLOWED: { code: 'BAD_REQUEST', messageFromCause: true },
  },
};

export const toCommonError = (error: IndicateurValeursError): CommonError =>
  match(error)
    .with('UNAUTHORIZED', () => 'UNAUTHORIZED' as const)
    .with('DATABASE_ERROR', () => 'DATABASE_ERROR' as const)
    .with(
      'INVALID_VALUE',
      'INDICATEUR_NOT_AVAILABLE',
      'PERIODICITE_MISMATCH',
      'USER_VALUE_NOT_ALLOWED',
      () => 'SERVER_ERROR' as const
    )
    .exhaustive();

export type IndicateurValeursFailure = Extract<
  Result<never, IndicateurValeursError>,
  { success: false }
>;

export const toCommonFailure = ({
  error,
  cause,
}: IndicateurValeursFailure): Result<never, CommonError> =>
  failure(toCommonError(error), cause);

export const toNonCanonicalDateValeurFailure = ({
  dateValeur,
  indicateurId,
  periodicite,
}: {
  dateValeur: string;
  indicateurId: number;
  periodicite: IndicateurPeriodicite;
}): Result<never, 'INVALID_VALUE'> =>
  failure(
    'INVALID_VALUE',
    new Error(
      `Date de valeur ${dateValeur} non canonique pour l'indicateur ${indicateurId} (${periodicite})`
    )
  );

export function toIndicateurValeursFailure(
  error: unknown
): Result<never, IndicateurValeursError> {
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

/** Preserve the legacy cause while application services expose typed results. */
export async function captureIndicateurValeursResult<T>(
  operation: () => Promise<T>
): Promise<Result<T, IndicateurValeursError>> {
  try {
    return success(await operation());
  } catch (error) {
    return toIndicateurValeursFailure(error);
  }
}

export async function captureIndicateurValeursResultOf<Data>(
  operation: () => Promise<Result<Data, IndicateurValeursError>>
): Promise<Result<Data, IndicateurValeursError>> {
  const captured = await captureIndicateurValeursResult(operation);
  return captured.success ? captured.data : captured;
}

export function getIndicateurValeursDataOrThrow<T>(
  result: Result<T, IndicateurValeursError>
): T {
  if (result.success) return result.data;
  throw result;
}
