import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'DEMARCHE_PCAET_NOT_FOUND',
  'EXPORT_NOT_FOUND',
  'ON_DEMAND_EXPORT_NOT_AVAILABLE',
  'EXPORT_URL_ERROR',
  'BUILD_EXPORT_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const demarchePcaetExportsErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    commonErrors: {
      UNAUTHORIZED: {
        code: 'FORBIDDEN',
        message:
          "Vous n'avez pas les permissions nécessaires pour télécharger les données de ce dépôt.",
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
      EXPORT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Ce dépôt n'a pas de données à exporter pour ce classeur.",
      },
      ON_DEMAND_EXPORT_NOT_AVAILABLE: {
        code: 'PRECONDITION_FAILED',
        message:
          "L'export à ce jour n'est proposé que pour un dépôt soumis sans version figée.",
      },
      EXPORT_URL_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Le lien de téléchargement n'a pas pu être généré",
      },
      BUILD_EXPORT_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "L'export des données n'a pas pu être généré, réessayez.",
      },
    },
  };

export const DemarchePcaetExportsErrorEnum = createErrorsEnum(specificErrors);
export type DemarchePcaetExportsError =
  keyof typeof DemarchePcaetExportsErrorEnum;
