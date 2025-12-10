import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'PLAN_NOT_FOUND',
  'GET_PILOTES_ERROR',
  'GET_REFERENTS_ERROR',
  'LIST_AXES_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const getPlanErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    PLAN_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Le plan demandé n'a pas été trouvé",
    },
    GET_PILOTES_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur de lecture des pilotes du plan',
    },
    GET_REFERENTS_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur de lecture des référents du plan',
    },
    LIST_AXES_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "Erreur de lecture de l'arborescence du plan",
    },
  },
};

export const GetPlanErrorEnum = createErrorsEnum(specificErrors);
export type GetPlanError = keyof typeof GetPlanErrorEnum;
