import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'GET_PREFS_ERROR',
  'PARSE_PREFS_ERROR',
  'UPDATE_PREFS_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const UserPreferencesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      GET_PREFS_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La récupération des préférences a échoué',
      },
      PARSE_PREFS_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La vérification des préférences a échoué',
      },
      UPDATE_PREFS_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La mise à jour des préférences a échoué',
      },
    },
  };

export const UserPreferencesErrorEnum = createErrorsEnum(specificErrors);
export type UserPreferencesError = keyof typeof UserPreferencesErrorEnum;
