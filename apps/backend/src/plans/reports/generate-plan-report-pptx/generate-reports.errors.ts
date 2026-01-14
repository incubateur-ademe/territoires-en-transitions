import { CreateDocumentErrorEnum } from '@tet/backend/collectivites/documents/create-document/create-document.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const GenerateReportSpecificErrors = [
  'CREATE_REPORT_GENERATION_ERROR',
  'GET_REPORT_GENERATION_ERROR',
  'UPDATE_REPORT_GENERATION_ERROR',
  'PLAN_NOT_FOUND',
  'PPT_BUILDER_ERROR',
  'CREATE_NOTIFICATION_ERROR',
  CreateDocumentErrorEnum.UPLOAD_STORAGE_ERROR,
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
      GET_REPORT_GENERATION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La récupération du job de génération du rapport a échoué',
      },
      UPDATE_REPORT_GENERATION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La mise à jour du job de génération du rapport a échoué',
      },
      PLAN_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le plan n'a pas été trouvé",
      },
      UPLOAD_STORAGE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Une erreur est survenue lors de l'upload du rapport généré",
      },
      CREATE_NOTIFICATION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Une erreur est survenue lors de la création de la notification',
      },
      PPT_BUILDER_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Une erreur est survenue lors de la construction du rapport PowerPoint',
      },
    },
  };

export const GenerateReportErrorEnum = createErrorsEnum(
  GenerateReportSpecificErrors
);
export type GenerateReportError = keyof typeof GenerateReportErrorEnum;
