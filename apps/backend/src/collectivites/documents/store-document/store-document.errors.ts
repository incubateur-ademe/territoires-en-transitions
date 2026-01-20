import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const StoreDocumentSpecificErrors = [
  'COLLECTIVITE_BUCKET_NOT_FOUND',
  'UPLOAD_STORAGE_ERROR',
  'STORE_DOCUMENT_ERROR',
  'STORAGE_OBJECT_NOT_FOUND',
  'INVALID_FILE',
] as const;
type StoreDocumentSpecificError = (typeof StoreDocumentSpecificErrors)[number];

export const storeDocumentErrorConfig: TrpcErrorHandlerConfig<StoreDocumentSpecificError> =
  {
    specificErrors: {
      STORAGE_OBJECT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message:
          'Le fichier doit avoir été uploadé dans le bucket de la collectivité avant de pouvoir créer le document',
      },
      COLLECTIVITE_BUCKET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le bucket de la collectivité n'a pas été trouvé",
      },
      UPLOAD_STORAGE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Une erreur est survenue lors de l'upload du fichier",
      },
      STORE_DOCUMENT_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Une erreur est survenue lors de la création du document dans la base de données',
      },
      INVALID_FILE: {
        code: 'BAD_REQUEST',
        message: 'Le fichier est invalide',
      },
    },
  };

export const StoreDocumentErrorEnum = createErrorsEnum(
  StoreDocumentSpecificErrors
);
export type StoreDocumentError = keyof typeof StoreDocumentErrorEnum;
