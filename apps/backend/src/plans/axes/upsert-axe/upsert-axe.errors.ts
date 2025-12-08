import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'CREATE_AXE_ERROR',
  'UPDATE_AXE_ERROR',
  'UPDATE_INDICATEURS_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const upsertAxeErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    CREATE_AXE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "La création de l'axe a échoué",
    },
    UPDATE_AXE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "La mise à jour de l'axe a échoué",
    },
    UPDATE_INDICATEURS_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "La mise à jour des indicateurs associés à l'axe a échoué",
    },
  },
};

export const UpsertAxeErrorEnum = createErrorsEnum(specificErrors);
export type UpsertAxeError = keyof typeof UpsertAxeErrorEnum;
