import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DEMARCHE_PCAET_NON_MODIFIABLE',
  'DOCUMENT_DEFINITION_NOT_FOUND',
  'COUVERTURE_NON_APPLICABLE',
  'PLAN_ACTIONS_NON_RATTACHE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const setDemarchePcaetDocumentCouvertureErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
      DOCUMENT_DEFINITION_NOT_FOUND: {
        code: 'BAD_REQUEST',
        message: "Cette pièce n'est pas attendue au dépôt du PCAET",
      },
      COUVERTURE_NON_APPLICABLE: {
        code: 'BAD_REQUEST',
        message:
          'Cette pièce ne peut pas être couverte par le plan d’actions suivi sur la plateforme',
      },
      PLAN_ACTIONS_NON_RATTACHE: {
        code: 'BAD_REQUEST',
        message:
          'Aucun plan d’actions n’est rattaché à la démarche : la pièce ne peut pas être déclarée couverte',
      },
    },
  };

export const SetDemarchePcaetDocumentCouvertureErrorEnum =
  createErrorsEnum(specificErrors);
export type SetDemarchePcaetDocumentCouvertureError =
  keyof typeof SetDemarchePcaetDocumentCouvertureErrorEnum;
