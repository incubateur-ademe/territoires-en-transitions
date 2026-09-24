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
  'FICHIER_NOT_FOUND',
  'AUDIT_NOT_OPEN',
  'DATABASE_ERROR',
  ...referentielModeGuardSpecificErrors,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const addAuditDocumentErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      AUDIT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: 'Aucun audit ne correspond à cet identifiant.',
      },
      FICHIER_NOT_FOUND: {
        code: 'BAD_REQUEST',
        message: "Le fichier n'appartient pas à la collectivité de cet audit.",
      },
      AUDIT_NOT_OPEN: {
        code: 'UNAUTHORIZED',
        message:
          'Un document ne peut plus être déposé sur un audit clos ou validé ; seul le rapport existant peut être remplacé.',
      },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Une erreur de base de données s'est produite lors du dépôt du document.",
      },
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const AddAuditDocumentErrorEnum = createErrorsEnum(specificErrors);
export type AddAuditDocumentError = keyof typeof AddAuditDocumentErrorEnum;
