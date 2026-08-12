import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DEMARCHE_PCAET_NON_MODIFIABLE',
  'DOCUMENT_DEFINITION_NOT_FOUND',
  'COUVERTURE_NON_APPLICABLE',
  'COUVERTURE_CONFLIT_DEPOT',
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
          'Cette pièce n’est pas modifiable au statut actuel de la démarche',
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
      COUVERTURE_CONFLIT_DEPOT: {
        code: 'CONFLICT',
        message:
          'Un document est déjà déposé pour cette pièce : retirez-le avant de la déclarer couverte par le plan d’actions',
      },
    },
  };

export const SetDemarchePcaetDocumentCouvertureErrorEnum =
  createErrorsEnum(specificErrors);
export type SetDemarchePcaetDocumentCouvertureError =
  keyof typeof SetDemarchePcaetDocumentCouvertureErrorEnum;
