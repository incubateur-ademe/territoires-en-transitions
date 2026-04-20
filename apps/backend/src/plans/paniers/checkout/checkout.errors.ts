import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'PANIER_NOT_FOUND',
  'PANIER_FROM_OTHER_COLLECTIVITE',
  'PLAN_NOT_FOUND',
  'PLAN_FROM_OTHER_COLLECTIVITE',
  'PANIER_EMPTY',
  'UPSERT_PLAN_FAILED',
  'LINK_PLAN_PANIER_FAILED',
  'CREATE_FICHE_FAILED',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const checkoutErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    PANIER_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Le panier demandé n'existe pas",
    },
    PANIER_FROM_OTHER_COLLECTIVITE: {
      code: 'FORBIDDEN',
      message:
        "Ce panier appartient à une autre collectivité et ne peut pas être validé ici",
    },
    PLAN_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Le plan demandé n'existe pas ou n'est pas un plan racine",
    },
    PLAN_FROM_OTHER_COLLECTIVITE: {
      code: 'FORBIDDEN',
      message:
        "Le plan fourni appartient à une autre collectivité et ne peut pas être utilisé",
    },
    PANIER_EMPTY: {
      code: 'BAD_REQUEST',
      message: "Le panier ne contient aucune action sélectionnée",
    },
    UPSERT_PLAN_FAILED: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "La création du plan a échoué",
    },
    LINK_PLAN_PANIER_FAILED: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Le lien entre le plan et le panier a échoué',
    },
    CREATE_FICHE_FAILED: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "La création d'une fiche action a échoué",
    },
  },
};

export const CheckoutErrorEnum = createErrorsEnum(specificErrors);
export type CheckoutError = keyof typeof CheckoutErrorEnum;
