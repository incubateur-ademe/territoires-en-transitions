import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const IndicateurVuesErrorEnum = createErrorsEnum();
export type IndicateurVuesError = keyof typeof IndicateurVuesErrorEnum;

export const indicateurVuesErrorConfig: TrpcErrorHandlerConfig<never> = {
  commonErrors: {
    NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Cette vue d'indicateurs n'existe pas",
    },
  },
};
