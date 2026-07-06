import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const collectivitePreferencesSpecificErrors = [
  'PREFERENCES_PARSE_ERROR',
  'COLLECTIVITE_NOT_FOUND',
] as const;
type SpecificError = (typeof collectivitePreferencesSpecificErrors)[number];

export const collectivitePreferencesTrpcErrorEntries = {
  PREFERENCES_PARSE_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Les préférences de la collectivité sont invalides',
  },
  COLLECTIVITE_NOT_FOUND: {
    code: 'NOT_FOUND',
    message: "La collectivité n'est pas trouvée",
  },
} as const;

export const collectivitePreferencesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: collectivitePreferencesTrpcErrorEntries,
  };

export const CollectivitePreferencesErrorEnum = createErrorsEnum(
  collectivitePreferencesSpecificErrors
);
export type CollectivitePreferencesError =
  keyof typeof CollectivitePreferencesErrorEnum;
