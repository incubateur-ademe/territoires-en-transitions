import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['DEMARCHE_PCAET_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listPlansErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    DEMARCHE_PCAET_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "La démarche n'a pas été trouvée",
    },
  },
};

export const ListPlansErrorEnum = createErrorsEnum(specificErrors);
export type ListPlansError = keyof typeof ListPlansErrorEnum;
