import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LIST_PUBLIC_DEMARCHES_PCAET_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listPublicDemarchesPcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      LIST_PUBLIC_DEMARCHES_PCAET_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur de lecture des démarches PCAET de la collectivité',
      },
    },
  };

export const ListPublicDemarchesPcaetErrorEnum =
  createErrorsEnum(specificErrors);
export type ListPublicDemarchesPcaetError =
  keyof typeof ListPublicDemarchesPcaetErrorEnum;
