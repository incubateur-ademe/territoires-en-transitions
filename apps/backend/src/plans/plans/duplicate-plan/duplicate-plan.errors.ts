import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

import { planCreationDisabledReasons } from '@tet/domain/plans';
import { planCreationErrorConfig } from '../plan-creation.errors';

const specificErrors = [
  'PLAN_NOT_FOUND',
  'DUPLICATE_PLAN_ERROR',
  ...planCreationDisabledReasons,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const duplicatePlanErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    ...planCreationErrorConfig,
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
