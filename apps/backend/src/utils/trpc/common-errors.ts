import { createEnumObject } from '../enum.utils';
import { ErrorConfigMap } from './trpc-error-config';

/**
 * Erreurs communes
 */
export const commonErrors = [
  'SERVER_ERROR',
  'UNAUTHORIZED',
  'DATABASE_ERROR',
] as const;
export const CommonErrorEnum = createEnumObject(commonErrors);
export type CommonError = (typeof commonErrors)[number];

/**
 * Configuration par défaut des erreurs communes avec leurs codes TRPC et messages
 */
export const COMMON_ERROR_CONFIG: ErrorConfigMap<CommonError> = {
  SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR' as const,
    message: "Une erreur serveur s'est produite",
  },
  UNAUTHORIZED: {
    code: 'FORBIDDEN' as const,
    message: "Vous n'avez pas les permissions nécessaires",
  },
  DATABASE_ERROR: {
    code: 'INTERNAL_SERVER_ERROR' as const,
    message: "Une erreur de base de données s'est produite",
  },
};
