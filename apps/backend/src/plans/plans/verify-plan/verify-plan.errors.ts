import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'PLAN_NOT_FOUND',
  'PLAN_NOT_IMPORTED',
  'VERIFY_PLAN_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const verifyPlanErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    PLAN_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Le plan demandé n'a pas été trouvé",
    },
    PLAN_NOT_IMPORTED: {
      code: 'BAD_REQUEST',
      message: "Seul un plan importé automatiquement attend d'être vérifié",
    },
    VERIFY_PLAN_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Une erreur est survenue lors de la validation du plan',
    },
  },
};

export const VerifyPlanErrorEnum = createErrorsEnum(specificErrors);
export type VerifyPlanError = keyof typeof VerifyPlanErrorEnum;
