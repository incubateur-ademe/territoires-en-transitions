import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'DOCUMENT_ADDITIONAL_NOT_FOUND',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const removeDemarchePcaetDocumentAdditionalErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
    },
  };

export const RemoveDemarchePcaetDocumentAdditionalErrorEnum =
  createErrorsEnum(specificErrors);
export type RemoveDemarchePcaetDocumentAdditionalError =
  keyof typeof RemoveDemarchePcaetDocumentAdditionalErrorEnum;
