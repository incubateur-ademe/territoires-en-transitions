import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['DEMARCHE_PCAET_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listAvisRecusErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    DEMARCHE_PCAET_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "La démarche n'a pas été trouvée",
    },
  },
};

export const ListAvisRecusErrorEnum = createErrorsEnum(specificErrors);
export type ListAvisRecusError = keyof typeof ListAvisRecusErrorEnum;
