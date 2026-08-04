import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DEMARCHE_NON_PUBLIABLE',
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
    },
  };

export const SetPublicationStatusErrorEnum = createErrorsEnum(specificErrors);
export type SetPublicationStatusError =
  keyof typeof SetPublicationStatusErrorEnum;
