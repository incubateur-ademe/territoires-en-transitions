import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'AVIS_NOT_FOUND',
  'AVIS_SANS_PIECE_JOINTE',
  'AVIS_FILE_URL_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const getAvisFileUrlErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      AVIS_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'avis n'a pas été trouvé",
      },
      AVIS_SANS_PIECE_JOINTE: {
        code: 'NOT_FOUND',
        message: "Cet avis n'a pas de rapport joint",
      },
      AVIS_FILE_URL_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Le lien de téléchargement n'a pas pu être généré",
      },
    },
  };

export const GetAvisFileUrlErrorEnum = createErrorsEnum(specificErrors);
export type GetAvisFileUrlError = keyof typeof GetAvisFileUrlErrorEnum;
