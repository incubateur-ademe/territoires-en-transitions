import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'DEMARCHE_PCAET_NOT_FOUND',
  'NO_DOCUMENT',
  'ARCHIVE_TOO_LARGE',
  'BUILD_ARCHIVE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const downloadDossierDocumentsErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    commonErrors: {
      UNAUTHORIZED: {
        code: 'FORBIDDEN',
        message:
          "Vous n'avez pas les permissions nécessaires pour télécharger les documents de ce dossier.",
      },
    },
    specificErrors: {
      DEMANDE_AVIS_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La demande d'avis n'a pas été trouvée",
      },
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET n'a pas été trouvée",
      },
      NO_DOCUMENT: {
        code: 'NOT_FOUND',
        message: 'Ce dossier ne porte aucun document téléchargeable.',
      },
      ARCHIVE_TOO_LARGE: {
        code: 'PAYLOAD_TOO_LARGE',
        message:
          "Les documents de ce dossier dépassent le volume d'un téléchargement groupé.",
      },
      BUILD_ARCHIVE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "L'archive des documents n'a pas pu être assemblée.",
      },
    },
  };

export const DownloadDossierDocumentsErrorEnum =
  createErrorsEnum(specificErrors);
export type DownloadDossierDocumentsError =
  keyof typeof DownloadDossierDocumentsErrorEnum;
