import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DEMARCHE_PCAET_NON_MODIFIABLE',
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
          'Les documents d’un dossier transmis pour avis ne sont plus modifiables',
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
