import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LIST_DEMANDES_AVIS_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listDemandesAvisErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      LIST_DEMANDES_AVIS_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Erreur de lecture des demandes d'avis",
      },
    },
  };

export const ListDemandesAvisErrorEnum = createErrorsEnum(specificErrors);
export type ListDemandesAvisError = keyof typeof ListDemandesAvisErrorEnum;
