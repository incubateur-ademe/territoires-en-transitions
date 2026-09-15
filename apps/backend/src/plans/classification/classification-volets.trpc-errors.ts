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
        message: 'Une analyse est déjà en cours pour cette collectivité',
      },
      COLLECTIVITE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La collectivité demandée n'existe pas",
      },
      GET_MOBILISATION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La lecture de la mobilisation a échoué',
      },
      NO_VOLET_TO_SCORE: {
        code: 'BAD_REQUEST',
        message:
          "Cette collectivité n'a aucun volet classé : lancez d'abord la classification",
      },
      NO_FICHE_TO_CLASSIFY: {
        code: 'BAD_REQUEST',
        message: 'Cette collectivité ne contient aucune fiche à classer',
      },
    },
  };
