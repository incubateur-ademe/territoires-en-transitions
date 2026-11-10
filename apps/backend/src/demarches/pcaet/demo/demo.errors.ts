import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DEMO_NON_ACTIVE',
  'STATUT_INCOMPATIBLE',
  'DEMO_FICHIER_ERROR',
  'DEMO_ECRITURE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const demarchePcaetDemoErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      DEMO_NON_ACTIVE: {
        code: 'FORBIDDEN',
        message:
          'Le mode démo est réservé aux super admins, sur une collectivité de test',
      },
      STATUT_INCOMPATIBLE: {
        code: 'CONFLICT',
        message: "Cette action de démo n'est pas possible à cette étape",
      },
      DEMO_FICHIER_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Les documents de démo n'ont pas pu être déposés",
      },
      DEMO_ECRITURE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "L'étape n'a pas pu être complétée",
      },
    },
  };

export const DemarchePcaetDemoErrorEnum = createErrorsEnum(specificErrors);
export type DemarchePcaetDemoError = keyof typeof DemarchePcaetDemoErrorEnum;
