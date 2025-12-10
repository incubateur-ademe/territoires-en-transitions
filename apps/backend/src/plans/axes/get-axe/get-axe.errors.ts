import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'AXE_NOT_FOUND',
  'GET_INDICATEURS_ERROR',
  'SERVER_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const getAxeErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    AXE_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "L'axe demandé n'a pas été trouvé",
    },
    GET_INDICATEURS_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "Erreur de lecture des indicateurs de l'axe",
    },
    SERVER_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "Une erreur est survenue lors de la récupération de l'axe",
    },
  },
};

export const GetAxeErrorEnum = createErrorsEnum(specificErrors);
export type GetAxeError = keyof typeof GetAxeErrorEnum;
