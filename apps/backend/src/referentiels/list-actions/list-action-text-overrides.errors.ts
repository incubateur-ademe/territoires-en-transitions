import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['INVALID_TEXT_VARIANT_KEY'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listActionTextOverridesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      INVALID_TEXT_VARIANT_KEY: {
        code: 'BAD_REQUEST',
        message: 'Clé de variante de texte invalide ou périmée',
      },
    },
  };

export const ListActionTextOverridesErrorEnum =
  createErrorsEnum(specificErrors);
export type ListActionTextOverridesError =
  keyof typeof ListActionTextOverridesErrorEnum;
