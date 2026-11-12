import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['COLLECTIVITE_EXISTE_DEJA', 'SIREN_INVALIDE'] as const;
type SpecificError = (typeof specificErrors)[number];

// Sans message : le code part au client dans `data.errorKey`, et l'app le
// traduit (`appLabels.erreursApi`).
export const collectiviteCrudErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      COLLECTIVITE_EXISTE_DEJA: { code: 'CONFLICT' },
      SIREN_INVALIDE: { code: 'BAD_REQUEST' },
    },
  };

export const CollectiviteCrudErrorEnum = createErrorsEnum(specificErrors);
export type CollectiviteCrudError = keyof typeof CollectiviteCrudErrorEnum;
