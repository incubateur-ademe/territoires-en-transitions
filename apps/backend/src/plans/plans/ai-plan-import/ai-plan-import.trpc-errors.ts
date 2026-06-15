import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import type { AiPlanImportSpecificError } from './ai-plan-import.errors';

export const aiPlanImportErrorConfig: TrpcErrorHandlerConfig<AiPlanImportSpecificError> =
  {
    specificErrors: {
      CREATE_JOB_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "La création du job d'import a échoué",
      },
      GET_JOB_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "La lecture du job d'import a échoué",
      },
      UPDATE_JOB_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "La mise à jour du job d'import a échoué",
      },
      JOB_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le job d'import demandé n'existe pas",
      },
      IN_FLIGHT_JOB_EXISTS: {
        code: 'CONFLICT',
        message: 'Un import est déjà en cours pour cette collectivité',
      },
      TOO_MANY_IN_FLIGHT_JOBS: {
        code: 'TOO_MANY_REQUESTS',
        message: "Trop d'imports en cours, veuillez réessayer plus tard",
      },
      UNSUPPORTED_FILE_TYPE: {
        code: 'BAD_REQUEST',
        message: 'Type de fichier non supporté (PDF, CSV ou Excel attendus)',
      },
      FILE_TOO_LARGE: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Le fichier dépasse la taille maximale autorisée',
      },
      UNKNOWN_PLAN_TYPE: {
        code: 'BAD_REQUEST',
        message: 'Type de plan inconnu',
      },
      STORAGE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "L'enregistrement du fichier source a échoué",
      },
      UNAUTHORIZED: {
        code: 'FORBIDDEN',
        message: "Vous n'avez pas le droit de lancer un import sur cette collectivité",
      },
    },
  };
