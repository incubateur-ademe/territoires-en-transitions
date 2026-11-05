import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'AVIS_NOT_FOUND',
  'AVIS_SANS_PIECE_JOINTE',
  'BUILD_ARCHIVE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const downloadAvisPiecesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    commonErrors: {
      UNAUTHORIZED: {
        code: 'FORBIDDEN',
        message:
          "Vous n'avez pas les permissions nécessaires pour télécharger cet avis.",
      },
    },
    specificErrors: {
      AVIS_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'avis n'a pas été trouvé",
      },
      AVIS_SANS_PIECE_JOINTE: {
        code: 'NOT_FOUND',
        message: "Cet avis n'a pas de rapport joint",
      },
      BUILD_ARCHIVE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "L'archive de l'avis n'a pas pu être assemblée.",
      },
    },
  };

export const DownloadAvisPiecesErrorEnum = createErrorsEnum(specificErrors);
export type DownloadAvisPiecesError = keyof typeof DownloadAvisPiecesErrorEnum;
