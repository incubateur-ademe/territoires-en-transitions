import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'DOCUMENT_DEFINITION_NOT_FOUND',
  'FICHIER_NOT_FOUND',
  'FICHIER_FORMAT_NON_SUPPORTE',
  'REPRISE_SANS_AVIS',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const addDemarchePcaetDocumentErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      DEMARCHE_PCAET_NON_MODIFIABLE: {
        code: 'CONFLICT',
        message:
          'Cette pièce n’est pas modifiable au statut actuel de la démarche',
      },
      DOCUMENT_DEFINITION_NOT_FOUND: {
        code: 'BAD_REQUEST',
        message: "Cette pièce n'est pas attendue au dépôt du PCAET",
      },
      FICHIER_NOT_FOUND: {
        code: 'NOT_FOUND',
        message:
          "Le fichier n'a pas été trouvé dans la bibliothèque de la collectivité",
      },
      FICHIER_FORMAT_NON_SUPPORTE: {
        code: 'BAD_REQUEST',
        message: "Le format de ce fichier n'est pas accepté dans ce dossier",
      },
      REPRISE_SANS_AVIS: {
        code: 'CONFLICT',
        message:
          'Cette pièce ne peut être reprise qu’après les avis rendus sur le dossier transmis',
      },
    },
  };

export const AddDemarchePcaetDocumentErrorEnum =
  createErrorsEnum(specificErrors);
export type AddDemarchePcaetDocumentError =
  keyof typeof AddDemarchePcaetDocumentErrorEnum;
