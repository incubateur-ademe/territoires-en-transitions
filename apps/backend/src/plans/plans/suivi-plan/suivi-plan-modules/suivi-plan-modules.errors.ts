import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['PLAN_NOT_FOUND', 'MODULE_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const suiviPlanModulesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      PLAN_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le plan demandé n'a pas été trouvé",
      },
      MODULE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le module demandé n'a pas été trouvé dans ce plan",
      },
    },
  };

export const SuiviPlanModulesErrorEnum = createErrorsEnum(specificErrors);
export type SuiviPlanModulesError = keyof typeof SuiviPlanModulesErrorEnum;
