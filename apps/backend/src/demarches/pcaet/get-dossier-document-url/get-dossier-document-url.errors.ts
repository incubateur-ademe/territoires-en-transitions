import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'DOCUMENT_NOT_FOUND',
  'DOCUMENT_URL_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const getDossierDocumentUrlErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMANDE_AVIS_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La demande d'avis n'a pas été trouvée",
      },
      DOCUMENT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le document n'a pas été trouvé dans ce dossier",
      },
      DOCUMENT_URL_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Le lien de téléchargement n'a pas pu être généré",
      },
    },
  };

export const GetDossierDocumentUrlErrorEnum = createErrorsEnum(specificErrors);
export type GetDossierDocumentUrlError =
  keyof typeof GetDossierDocumentUrlErrorEnum;
