import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LIST_AXES_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listAxesErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    LIST_AXES_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'La récupération de la liste des axes a échoué',
    },
  },
};

export const ListAxesErrorEnum = createErrorsEnum(specificErrors);
export type ListAxesError = keyof typeof ListAxesErrorEnum;

