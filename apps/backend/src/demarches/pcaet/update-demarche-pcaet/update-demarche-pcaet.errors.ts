import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'INVALID_PLAN_ACTION',
  'PLAN_DEJA_RATTACHE',
  'SET_PILOTES_ERROR',
  'SET_PLAN_ACTIONS_ERROR',
  'UPDATE_DEMARCHE_PCAET_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateDemarchePcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
      INVALID_PLAN_ACTION: {
        code: 'BAD_REQUEST',
        message:
          'Un des plans d’action à rattacher n’existe pas dans cette collectivité',
      },
      PLAN_DEJA_RATTACHE: {
        code: 'CONFLICT',
        message:
          'Ce plan d’action est déjà rattaché à une autre démarche en cours',
      },
      SET_PILOTES_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de l’écriture des pilotes de la démarche PCAET',
      },
      SET_PLAN_ACTIONS_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Erreur lors du rattachement des plans d’action à la démarche PCAET',
      },
      UPDATE_DEMARCHE_PCAET_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la mise à jour de la démarche PCAET',
      },
    },
  };

export const UpdateDemarchePcaetErrorEnum = createErrorsEnum(specificErrors);
export type UpdateDemarchePcaetError =
  keyof typeof UpdateDemarchePcaetErrorEnum;
