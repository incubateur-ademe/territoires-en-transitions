import { failure, Result } from '@tet/backend/utils/result.type';
import {
  commonErrors,
  type CommonError,
} from '@tet/backend/utils/trpc/common-errors';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import { match } from 'ts-pattern';
import {
  IndicateurValeursError,
  IndicateurValeursFailure,
} from './indicateur-valeurs.errors';

type SpecificError = 'INVALID_GRID_VALEUR' | 'USER_VALUE_NOT_ALLOWED';

export const upsertGridValeursErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      INVALID_GRID_VALEUR: {
        code: 'BAD_REQUEST',
        message:
          'Valeur invalide ou indicateur non disponible pour la collectivité',
      },
      USER_VALUE_NOT_ALLOWED: {
        code: 'BAD_REQUEST',
        message: "Cet indicateur n'accepte pas de valeur utilisateur",
      },
    },
  };

export type UpsertGridValeursError = SpecificError | CommonError;

const upsertGridValeursErrors: UpsertGridValeursError[] = [
  'INVALID_GRID_VALEUR',
  'USER_VALUE_NOT_ALLOWED',
  ...commonErrors,
];

export const isUpsertGridValeursError = (
  error: unknown
): error is UpsertGridValeursError =>
  upsertGridValeursErrors.some((code) => code === error);

const toGridError = (error: IndicateurValeursError): UpsertGridValeursError =>
  match(error)
    .with(
      'INVALID_VALUE',
      'INDICATEUR_NOT_AVAILABLE',
      'PERIODICITE_MISMATCH',
      () => 'INVALID_GRID_VALEUR' as const
    )
    .with('UNAUTHORIZED', () => 'UNAUTHORIZED' as const)
    .with('USER_VALUE_NOT_ALLOWED', () => 'USER_VALUE_NOT_ALLOWED' as const)
    .with('DATABASE_ERROR', () => 'DATABASE_ERROR' as const)
    .exhaustive();

export const toGridFailure = ({
  error,
  cause,
}: IndicateurValeursFailure): Result<never, UpsertGridValeursError> =>
  failure(toGridError(error), cause);
