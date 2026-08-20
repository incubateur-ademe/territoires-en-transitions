import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LIST_PLAN_LINKS_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listPlanLinksErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    LIST_PLAN_LINKS_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'Erreur de lecture des plans rattachés aux démarches de la collectivité',
    },
  },
};

export const ListPlanLinksErrorEnum = createErrorsEnum(specificErrors);
export type ListPlanLinksError = keyof typeof ListPlanLinksErrorEnum;
