import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'UNKNOWN_REFERENTIEL',
  'NO_DOCUMENT',
  'BUILD_ARCHIVE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const downloadDocumentsMesureErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    commonErrors: {
      UNAUTHORIZED: {
        code: 'FORBIDDEN',
        message:
          "Vous n'avez pas les permissions nécessaires pour télécharger les documents de cette mesure.",
      },
    },
    specificErrors: {
      UNKNOWN_REFERENTIEL: {
        code: 'BAD_REQUEST',
        message: "L'identifiant de mesure ne désigne aucun référentiel connu.",
      },
      NO_DOCUMENT: {
        code: 'NOT_FOUND',
        message: 'Cette mesure ne porte aucun document téléchargeable.',
      },
      BUILD_ARCHIVE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "L'archive des documents n'a pas pu être assemblée.",
      },
    },
  };

export const DownloadDocumentsMesureErrorEnum =
  createErrorsEnum(specificErrors);
export type DownloadDocumentsMesureError =
  keyof typeof DownloadDocumentsMesureErrorEnum;
