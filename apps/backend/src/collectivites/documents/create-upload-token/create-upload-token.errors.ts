import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const CreateUploadTokenSpecificErrors = [
  'COLLECTIVITE_BUCKET_NOT_FOUND',
  'SIGN_UPLOAD_ERROR',
  'FICHIER_INFECTE',
] as const;

type CreateUploadTokenSpecificError =
  (typeof CreateUploadTokenSpecificErrors)[number];

export const createUploadTokenErrorConfig: TrpcErrorHandlerConfig<CreateUploadTokenSpecificError> =
  {
    specificErrors: {
      COLLECTIVITE_BUCKET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le bucket de la collectivité n'a pas été trouvé",
      },
      SIGN_UPLOAD_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Une erreur est survenue lors de la préparation du dépôt du fichier',
      },
      FICHIER_INFECTE: {
        code: 'BAD_REQUEST',
        message:
          'Ce fichier contient une menace détectée par notre antivirus : il ne peut pas être déposé',
      },
    },
  };

export const CreateUploadTokenErrorEnum = createErrorsEnum(
  CreateUploadTokenSpecificErrors
);
export type CreateUploadTokenError = keyof typeof CreateUploadTokenErrorEnum;
