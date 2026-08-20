import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'DOCUMENTS_ADDITIONAL_NON_AUTORISES',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const createDemarchePcaetDocumentAdditionalErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
      DOCUMENTS_ADDITIONAL_NON_AUTORISES: {
        code: 'BAD_REQUEST',
        message:
          'Cette partie du dossier n’accepte pas de document hors des pièces attendues',
      },
    },
  };

export const CreateDemarchePcaetDocumentAdditionalErrorEnum =
  createErrorsEnum(specificErrors);
export type CreateDemarchePcaetDocumentAdditionalError =
  keyof typeof CreateDemarchePcaetDocumentAdditionalErrorEnum;
