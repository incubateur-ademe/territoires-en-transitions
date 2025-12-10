import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'CREATE_PLAN_ERROR',
  'UPDATE_PLAN_ERROR',
  'UPDATE_REFERENTS_ERROR',
  'UPDATE_PILOTES_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const mutatePlanErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    CREATE_PLAN_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'La création du plan a échoué',
    },
    UPDATE_PLAN_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'La mise à jour du plan a échoué',
    },
    UPDATE_REFERENTS_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'La mise à jour des référents associés au plan a échoué',
    },
    UPDATE_PILOTES_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'La mise à jour des pilotes associés au plan a échoué',
    },
  },
};

export const MutatePlanErrorEnum = createErrorsEnum(specificErrors);
export type MutatePlanError = keyof typeof MutatePlanErrorEnum;
