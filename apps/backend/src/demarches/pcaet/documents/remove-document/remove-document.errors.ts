import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'DOCUMENT_NOT_FOUND',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const removeDemarchePcaetDocumentErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
      DOCUMENT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Aucun document n'est déposé pour cette pièce attendue",
      },
    },
  };

export const RemoveDemarchePcaetDocumentErrorEnum =
  createErrorsEnum(specificErrors);
export type RemoveDemarchePcaetDocumentError =
  keyof typeof RemoveDemarchePcaetDocumentErrorEnum;
