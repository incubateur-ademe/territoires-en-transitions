import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LIST_PLANS_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listPlansErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    LIST_PLANS_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'La récupération de la liste des plans a échoué',
    },
  },
};

export const ListPlansErrorEnum = createErrorsEnum(specificErrors);
export type ListPlansError = keyof typeof ListPlansErrorEnum;
