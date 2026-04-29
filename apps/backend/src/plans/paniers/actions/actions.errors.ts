import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['PANIER_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const panierActionsErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    PANIER_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Le panier demandé n'existe pas",
    },
  },
};

export const PanierActionsErrorEnum = createErrorsEnum(specificErrors);
export type PanierActionsError = keyof typeof PanierActionsErrorEnum;
