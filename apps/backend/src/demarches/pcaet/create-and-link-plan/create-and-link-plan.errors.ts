import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DEMARCHE_PCAET_NON_MODIFIABLE',
  'PLAN_DEJA_RATTACHE',
  'INVALID_PLAN_TYPE',
  'PCAET_PLAN_TYPE_NOT_FOUND',
  'CREATE_PLAN_ERROR',
  'LINK_PLAN_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const createAndLinkPlanErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      DEMARCHE_PCAET_NON_MODIFIABLE: {
        code: 'CONFLICT',
        message:
          'Une démarche transmise pour avis n’est plus modifiable — reprenez l’élaboration pour la modifier',
      },
      PLAN_DEJA_RATTACHE: {
        code: 'CONFLICT',
        message:
          'Ce plan d’action est déjà rattaché à une autre démarche en cours',
      },
      INVALID_PLAN_TYPE: {
        code: 'BAD_REQUEST',
        message: 'Le type de plan demandé n’existe pas',
      },
      PCAET_PLAN_TYPE_NOT_FOUND: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Le type de plan PCAET est introuvable dans le référentiel des types de plans',
      },
      CREATE_PLAN_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la création du plan d’action',
      },
      LINK_PLAN_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors du rattachement du plan créé à la démarche',
      },
    },
  };

export const CreateAndLinkPlanErrorEnum = createErrorsEnum(specificErrors);
export type CreateAndLinkPlanError = keyof typeof CreateAndLinkPlanErrorEnum;
