import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'DOCUMENT_ADDITIONAL_NOT_FOUND',
  'FICHIER_NOT_FOUND',
  'FICHIER_FORMAT_NON_SUPPORTE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateDemarchePcaetDocumentAdditionalErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
      DOCUMENT_ADDITIONAL_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Ce document n'a pas été trouvé dans le dossier",
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
    },
  };

export const UpdateDemarchePcaetDocumentAdditionalErrorEnum =
  createErrorsEnum(specificErrors);
export type UpdateDemarchePcaetDocumentAdditionalError =
  keyof typeof UpdateDemarchePcaetDocumentAdditionalErrorEnum;
