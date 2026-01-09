import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const UploadDocumentSpecificErrors = [
  'COLLECTIVITE_BUCKET_NOT_FOUND',
  'UPLOAD_STORAGE_ERROR',
] as const;
type UploadDocumentSpecificError =
  (typeof UploadDocumentSpecificErrors)[number];

export const uploadDocumentErrorConfig: TrpcErrorHandlerConfig<UploadDocumentSpecificError> =
  {
    specificErrors: {
      COLLECTIVITE_BUCKET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le bucket de la collectivité n'a pas été trouvé",
      },
      UPLOAD_STORAGE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Une erreur est survenue lors de l'upload du fichier",
      },
    },
  };

export const UploadDocumentErrorEnum = createErrorsEnum(
  UploadDocumentSpecificErrors
);
export type UploadDocumentError = keyof typeof UploadDocumentErrorEnum;
