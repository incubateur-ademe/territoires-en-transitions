import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DEMARCHE_NON_PUBLIABLE',
  'DOCUMENTS_AVAL_INCOMPLETS',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const setPublicationStatusErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      DEMARCHE_NON_PUBLIABLE: {
        code: 'CONFLICT',
        message: 'Seule une démarche adoptée peut être publiée',
      },
      DOCUMENTS_AVAL_INCOMPLETS: {
        code: 'CONFLICT',
        message:
          'Les pièces requises pour la publication n’ont pas toutes été déposées',
      },
    },
  };

export const SetPublicationStatusErrorEnum = createErrorsEnum(specificErrors);
export type SetPublicationStatusError =
  keyof typeof SetPublicationStatusErrorEnum;
