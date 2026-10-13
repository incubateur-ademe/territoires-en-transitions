import type { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';

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
