import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LIST_DEMARCHES_PCAET_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listDemarchesPcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      LIST_DEMARCHES_PCAET_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur de lecture des démarches PCAET de la collectivité',
      },
    },
  };

export const ListDemarchesPcaetErrorEnum = createErrorsEnum(specificErrors);
export type ListDemarchesPcaetError = keyof typeof ListDemarchesPcaetErrorEnum;
