import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const CreateDocumentSpecificErrors = [
  'COLLECTIVITE_BUCKET_NOT_FOUND',
  'UPLOAD_STORAGE_ERROR',
  'CREATE_DOCUMENT_ERROR',
  'STORAGE_OBJECT_NOT_FOUND',
] as const;
type CreateDocumentSpecificError =
  (typeof CreateDocumentSpecificErrors)[number];

export const createDocumentErrorConfig: TrpcErrorHandlerConfig<CreateDocumentSpecificError> =
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
      CREATE_DOCUMENT_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Une erreur est survenue lors de la création du document dans la base de données',
      },
    },
  };

export const CreateDocumentErrorEnum = createErrorsEnum(
  CreateDocumentSpecificErrors
);
export type CreateDocumentError = keyof typeof CreateDocumentErrorEnum;
