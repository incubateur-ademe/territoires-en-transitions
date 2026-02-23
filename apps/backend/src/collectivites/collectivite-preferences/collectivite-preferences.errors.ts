import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'PREFERENCES_PARSE_ERROR',
  'COLLECTIVITE_NOT_FOUND',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const collectivitePreferencesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      PREFERENCES_PARSE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Les préférences de la collectivité sont invalides',
      },
      COLLECTIVITE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La collectivité n'est pas trouvée",
      },
    },
  };

export const CollectivitePreferencesErrorEnum =
  createErrorsEnum(specificErrors);
export type CollectivitePreferencesError =
  keyof typeof CollectivitePreferencesErrorEnum;
