import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['PLAN_NOT_FOUND', 'DELETE_PLAN_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const deletePlanErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    PLAN_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Le plan demandé n'a pas été trouvé",
    },
    DELETE_PLAN_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Une erreur est survenue lors de la suppression du plan',
    },
  },
};

export const DeletePlanErrorEnum = createErrorsEnum(specificErrors);
export type DeletePlanError = keyof typeof DeletePlanErrorEnum;
