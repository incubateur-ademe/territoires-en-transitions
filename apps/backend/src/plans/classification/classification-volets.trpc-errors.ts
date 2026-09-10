import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import type { ClassificationVoletsSpecificError } from './classification-volets.errors';

export const classificationVoletsErrorConfig: TrpcErrorHandlerConfig<ClassificationVoletsSpecificError> =
  {
    specificErrors: {
      CREATE_JOB_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La création du job de classification a échoué',
      },
      GET_JOB_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La lecture du job de classification a échoué',
      },
      UPDATE_JOB_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La mise à jour du job de classification a échoué',
      },
      JOB_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le job de classification demandé n'existe pas",
      },
      JOB_TRANSITION_REFUSED: {
        code: 'CONFLICT',
        message:
          "Le job de classification n'est pas dans un état permettant cette transition",
      },
      IN_FLIGHT_JOB_EXISTS: {
        code: 'CONFLICT',
        message: 'Une classification est déjà en cours pour ce plan',
      },
      PLAN_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le plan demandé n'existe pas",
      },
      NOT_A_PLAN: {
        code: 'BAD_REQUEST',
        message: "L'identifiant fourni désigne un axe et non un plan",
      },
      NO_FICHE_TO_CLASSIFY: {
        code: 'BAD_REQUEST',
        message: 'Ce plan ne contient aucune fiche à classer',
      },
    },
  };
