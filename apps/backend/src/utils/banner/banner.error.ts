import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'BANNER_NOT_AUTHORIZED',
  'BANNER_INVALID_CONTENT',
  'BANNER_DATABASE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const bannerErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    BANNER_NOT_AUTHORIZED: {
      code: 'FORBIDDEN',
      message:
        "Vous devez être un utilisateur support avec le mode super-admin actif pour modifier la bannière",
    },
    BANNER_INVALID_CONTENT: {
      code: 'BAD_REQUEST',
      message:
        'Le contenu de la bannière est entièrement filtré par la sanitization (toutes les balises ont été retirées).',
    },
    BANNER_DATABASE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'Erreur interne lors de l\'écriture en base. Réessayez ou contactez le support technique.',
    },
  },
};

export const BannerErrorEnum = createErrorsEnum(specificErrors);
export type BannerError = keyof typeof BannerErrorEnum;
