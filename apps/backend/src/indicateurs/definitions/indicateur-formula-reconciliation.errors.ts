import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['INVALID_DRAIN_LIMIT'] as const;
type SpecificError = (typeof specificErrors)[number];

export const indicateurFormulaReconciliationErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      INVALID_DRAIN_LIMIT: {
        code: 'BAD_REQUEST',
        message:
          'La limite du drain des réconciliations de formules est invalide.',
      },
    },
  };

export const FormulaReconciliationErrorEnum = createErrorsEnum(specificErrors);
export type FormulaReconciliationError =
  keyof typeof FormulaReconciliationErrorEnum;
