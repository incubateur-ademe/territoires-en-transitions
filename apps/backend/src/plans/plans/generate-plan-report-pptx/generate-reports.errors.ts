import { UploadDocumentSpecificErrors } from '@tet/backend/collectivites/documents/upload-document/upload-document.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const GenerateReportSpecificErrors = [
  'CREATE_REPORT_GENERATION_ERROR',
  'UPDATE_REPORT_GENERATION_ERROR',
  'PLAN_NOT_FOUND',
  ...UploadDocumentSpecificErrors,
] as const;
type GenerateReportSpecificError =
  (typeof GenerateReportSpecificErrors)[number];

export const generateReportErrorConfig: TrpcErrorHandlerConfig<GenerateReportSpecificError> =
  {
    specificErrors: {
      CREATE_REPORT_GENERATION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La création du job de génération du rapport a échoué',
      },
      UPDATE_REPORT_GENERATION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La mise à jour du job de génération du rapport a échoué',
      },
      PLAN_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le plan n'a pas été trouvé",
      },
      COLLECTIVITE_BUCKET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le bucket de la collectivité n'a pas été trouvé",
      },
      UPLOAD_STORAGE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Une erreur est survenue lors de l'upload du rapport généré",
      },
    },
  };

export const GenerateReportErrorEnum = createErrorsEnum(
  GenerateReportSpecificErrors
);
export type GenerateReportError = keyof typeof GenerateReportErrorEnum;
