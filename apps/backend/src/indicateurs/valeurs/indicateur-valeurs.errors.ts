import { AuthRole } from '@tet/backend/users/models/auth.models';
import { failure, Result } from '@tet/backend/utils/result.type';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { match } from 'ts-pattern';
import type { ListIndicateursError } from '../indicateurs/list-indicateurs/list-indicateurs.errors';
import type { IndicateurValeursReadDenial } from './indicateur-valeurs-read-access.service';

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

const mutateOperation = PermissionOperationEnum['INDICATEURS.VALEURS.MUTATE'];

export const toMutatePermissionDeniedFailure = ({
  userId,
  collectiviteId,
  isApiKeyDenied,
}: {
  userId: string | null;
  collectiviteId: number;
  isApiKeyDenied: boolean;
}): Result<never, 'UNAUTHORIZED'> =>
  failure(
    'UNAUTHORIZED',
    new Error(
      isApiKeyDenied
        ? `Droits insuffisants, la clé d'api n'a pas l'autorisation ${mutateOperation}.`
        : `Droits insuffisants, l'utilisateur ${userId} n'a pas l'autorisation ${mutateOperation} sur la ressource ${ResourceType.COLLECTIVITE} ${collectiviteId}`
    )
  );

export const toServiceRoleRequiredFailure = (): Result<never, 'UNAUTHORIZED'> =>
  failure(
    'UNAUTHORIZED',
    new Error(
      `Droits insuffisants, l'utilisateur n'a pas le rôle ${AuthRole.SERVICE_ROLE}`
    )
  );

export const toReadValeursDeniedFailure = ({
  userId,
  collectiviteId,
  denial,
}: {
  userId: string | null;
  collectiviteId: number;
  denial: IndicateurValeursReadDenial;
}): Result<never, 'UNAUTHORIZED'> =>
  failure(
    'UNAUTHORIZED',
    new Error(
      `Droits insuffisants, l'utilisateur ${userId} n'a pas l'autorisation ${
        denial === 'READ_CONFIDENTIEL_DENIED'
          ? PermissionOperationEnum['INDICATEURS.VALEURS.READ_CONFIDENTIEL']
          : PermissionOperationEnum['INDICATEURS.VALEURS.READ']
      } sur la ressource ${ResourceType.COLLECTIVITE} ${collectiviteId}`
    )
  );

export const toReadContextRequiredFailure = (
  collectiviteId: number
): Result<never, 'UNAUTHORIZED'> =>
  failure(
    'UNAUTHORIZED',
    new Error(
      `Un contexte utilisateur ou une capacité interne explicite est requis pour lire les valeurs de la collectivité ${collectiviteId}`
    )
  );

export const toMissingIndicateurSelectionFailure = (): Result<
  never,
  'INVALID_VALUE'
> =>
  failure(
    'INVALID_VALUE',
    new Error('indicateurIds or identifiantsReferentiel required')
  );

const indicateurValeursErrorByListError: Record<
  ListIndicateursError,
  IndicateurValeursError
> = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INDICATEUR_NOT_FOUND: 'INVALID_VALUE',
  DATABASE_ERROR: 'DATABASE_ERROR',
};

export const fromListIndicateursFailure = ({
  error,
  cause,
}: {
  error: ListIndicateursError;
  cause?: Error;
}): Result<never, IndicateurValeursError> =>
  failure(indicateurValeursErrorByListError[error], cause);

export function getIndicateurValeursDataOrThrow<T>(
  result: Result<T, IndicateurValeursError>
): T {
  if (result.success) return result.data;
  throw result;
}
