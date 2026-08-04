import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['DEMARCHE_PCAET_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const getDemarchePcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
    },
  };

export const GetDemarchePcaetErrorEnum = createErrorsEnum(specificErrors);
export type GetDemarchePcaetError = keyof typeof GetDemarchePcaetErrorEnum;
