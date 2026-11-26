import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'FICHE_NOT_FOUND',
  'BUDGET_NOT_FOUND',
  'INVALID_FICHE_ID',
  'DUPLICATE_BUDGET',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const ficheActionBudgetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    commonErrors: {
      UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
    },
    specificErrors: {
      FICHE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La fiche action demandée n'existe pas",
      },
      BUDGET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le budget demandé n'existe pas",
      },
      INVALID_FICHE_ID: {
        code: 'BAD_REQUEST',
        message: 'Tous les budgets doivent appartenir à la même fiche',
      },
      DUPLICATE_BUDGET: {
        code: 'BAD_REQUEST',
        message: 'La liste contient des budgets en double',
      },
    },
  };

export const FicheActionBudgetErrorEnum = createErrorsEnum(specificErrors);
export type FicheActionBudgetError = keyof typeof FicheActionBudgetErrorEnum;
