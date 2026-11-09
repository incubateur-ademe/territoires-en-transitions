import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LIST_DEMARCHES_COUVRANTES_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listDemarchesCouvrantesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      LIST_DEMARCHES_COUVRANTES_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Erreur de lecture des dépôts PCAET qui couvrent la collectivité',
      },
    },
  };

export const ListDemarchesCouvrantesErrorEnum =
  createErrorsEnum(specificErrors);
export type ListDemarchesCouvrantesError =
  keyof typeof ListDemarchesCouvrantesErrorEnum;
