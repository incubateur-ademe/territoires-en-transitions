import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['CREATE_AXE_ERROR', 'UPDATE_AXE_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const mutateAxeErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    CREATE_AXE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "La création de l'axe a échoué",
    },
    UPDATE_AXE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "La mise à jour de l'axe a échoué",
    },
  },
};

export const MutateAxeErrorEnum = createErrorsEnum(specificErrors);
export type MutateAxeError = keyof typeof MutateAxeErrorEnum;
