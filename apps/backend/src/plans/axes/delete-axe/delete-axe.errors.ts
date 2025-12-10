import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['AXE_NOT_FOUND', 'DELETE_AXES_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const deleteAxeErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    AXE_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "L'axe demandé n'a pas été trouvé",
    },
    DELETE_AXES_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "Une erreur est survenue lors de la suppression de l'axe",
    },
  },
};

export const DeleteAxeErrorEnum = createErrorsEnum(specificErrors);
export type DeleteAxeError = keyof typeof DeleteAxeErrorEnum;
