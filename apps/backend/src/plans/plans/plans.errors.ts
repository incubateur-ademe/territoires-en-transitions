import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['PLAN_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const planErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    PLAN_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Le plan demandé n'existe pas",
    },
  },
};

export const PlanErrorEnum = createErrorsEnum(specificErrors);
export type PlanError = keyof typeof PlanErrorEnum;
