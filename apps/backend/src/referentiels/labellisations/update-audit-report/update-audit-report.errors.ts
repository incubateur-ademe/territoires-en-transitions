import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'PREUVE_NOT_FOUND',
  'FICHIER_NOT_FOUND',
  'UPDATE_NOT_ALLOWED',
  'DATABASE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateAuditReportErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      PREUVE_NOT_FOUND: {
        code: 'BAD_REQUEST',
        message: "Aucun rapport d'audit trouvé pour cette preuve.",
      },
      FICHIER_NOT_FOUND: {
        code: 'BAD_REQUEST',
        message: "Le fichier n'appartient pas à la collectivité de cet audit.",
      },
      UPDATE_NOT_ALLOWED: {
        code: 'UNAUTHORIZED',
        message:
          "Seul l'auditeur de cet audit peut remplacer le rapport, et uniquement dans les 15 jours suivant la clôture.",
      },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Une erreur de base de données s'est produite lors du remplacement du rapport.",
      },
    },
  };

export const UpdateAuditReportErrorEnum = createErrorsEnum(specificErrors);
export type UpdateAuditReportError = keyof typeof UpdateAuditReportErrorEnum;
