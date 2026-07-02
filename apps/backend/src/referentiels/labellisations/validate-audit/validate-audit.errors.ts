import {
  referentielModeGuardSpecificErrors,
  referentielNotWritableTrpcErrorEntry,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'AUDIT_NOT_FOUND',
  'AUDIT_ALREADY_VALIDATED',
  'DATABASE_ERROR',
  ...referentielModeGuardSpecificErrors,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const validateAuditErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      AUDIT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'audit demandé n'a pas été trouvé.",
      },
      AUDIT_ALREADY_VALIDATED: {
        code: 'BAD_REQUEST',
        message: "L'audit a déjà été validé.",
      },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Une erreur de base de données s'est produite lors de la validation de l'audit.",
      },
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const ValidateAuditErrorEnum = createErrorsEnum(specificErrors);
export type ValidateAuditError = keyof typeof ValidateAuditErrorEnum;
