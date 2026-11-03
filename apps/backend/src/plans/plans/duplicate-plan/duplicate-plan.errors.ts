import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

import { ELECTRIFICATION_PLAN_CREATION_DISABLED_MESSAGE } from '@tet/domain/plans';

const specificErrors = [
  'PLAN_NOT_FOUND',
  'DUPLICATE_PLAN_ERROR',
  'ELECTRIFICATION_CREATION_DISABLED',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const duplicatePlanErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    ELECTRIFICATION_CREATION_DISABLED: {
      code: 'BAD_REQUEST',
      message: ELECTRIFICATION_PLAN_CREATION_DISABLED_MESSAGE,
    },
    PLAN_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Le plan à dupliquer n'a pas été trouvé",
    },
    DUPLICATE_PLAN_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Une erreur est survenue lors de la duplication du plan',
    },
  },
};

export const DuplicatePlanErrorEnum = createErrorsEnum(specificErrors);
export type DuplicatePlanError = keyof typeof DuplicatePlanErrorEnum;
