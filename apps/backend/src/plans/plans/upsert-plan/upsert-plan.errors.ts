import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'CREATE_PLAN_ERROR',
  'UPDATE_PLAN_ERROR',
  'UPDATE_REFERENTS_ERROR',
  'UPDATE_PILOTES_ERROR',
  'PLAN_NOT_FOUND',
  'NOT_A_PLAN',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const upsertPlanErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
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
    PLAN_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Le plan demandé n'existe pas",
    },
    NOT_A_PLAN: {
      code: 'BAD_REQUEST',
      message:
        "L'axe ciblé n'est pas un plan (il possède un parent)",
    },
  },
};

export const UpsertPlanErrorEnum = createErrorsEnum(specificErrors);
export type UpsertPlanError = keyof typeof UpsertPlanErrorEnum;
