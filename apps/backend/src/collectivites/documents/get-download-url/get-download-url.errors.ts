import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const GetDownloadUrlSpecificErrors = [
  'DOCUMENT_NOT_FOUND',
  'COLLECTIVITE_BUCKET_NOT_FOUND',
  'SIGN_DOWNLOAD_ERROR',
] as const;

type GetDownloadUrlSpecificError =
  (typeof GetDownloadUrlSpecificErrors)[number];

export const getDownloadUrlErrorConfig: TrpcErrorHandlerConfig<GetDownloadUrlSpecificError> =
  {
    specificErrors: {
      DOCUMENT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le document demandé n'existe pas",
      },
      COLLECTIVITE_BUCKET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le bucket de la collectivité n'a pas été trouvé",
      },
      SIGN_DOWNLOAD_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Une erreur est survenue lors de la préparation du téléchargement',
      },
    },
  };

export const GetDownloadUrlErrorEnum = createErrorsEnum(
  GetDownloadUrlSpecificErrors
);
export type GetDownloadUrlError = keyof typeof GetDownloadUrlErrorEnum;
