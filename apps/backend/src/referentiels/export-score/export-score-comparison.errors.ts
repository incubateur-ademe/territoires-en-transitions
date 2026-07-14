import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'EXPORT_SNAPSHOT_NOT_FOUND',
  'EXPORT_SNAPSHOT_REFERENCE_REQUIRED',
  'EXPORT_PRE_AUDIT_SNAPSHOT_NOT_FOUND',
  'EXPORT_INVALID_MODE',
  'EXPORT_SNAPSHOT_COMPUTE_FAILED',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const exportScoreComparisonErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      EXPORT_SNAPSHOT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message:
          "Aucun snapshot de score avec la référence demandée n'a été trouvé",
      },
      EXPORT_SNAPSHOT_REFERENCE_REQUIRED: {
        code: 'NOT_FOUND',
        message: 'Pas de référence de snapshot fournie',
      },
      EXPORT_PRE_AUDIT_SNAPSHOT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: 'Aucun snapshot pre-audit ouvert trouvé pour cette collectivité',
      },
      EXPORT_INVALID_MODE: {
        code: 'BAD_REQUEST',
        message: "Mode d'export invalide",
      },
      EXPORT_SNAPSHOT_COMPUTE_FAILED: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Impossible de calculer le snapshot de score',
      },
    },
  };

export const ExportScoreComparisonErrorEnum = createErrorsEnum(specificErrors);
export type ExportScoreComparisonError =
  keyof typeof ExportScoreComparisonErrorEnum;
