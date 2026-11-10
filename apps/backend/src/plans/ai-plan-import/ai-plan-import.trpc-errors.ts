import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import { AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY } from './ai-plan-import.constants';
import {
  aiPlanImportErrorMessages,
  type AiPlanImportSpecificError,
} from './ai-plan-import.errors';

export const aiPlanImportErrorConfig: TrpcErrorHandlerConfig<AiPlanImportSpecificError> =
  {
    specificErrors: {
      ELECTRIFICATION_REQUIRES_DEDICATED_IMPORT: {
        code: 'BAD_REQUEST',
        message:
          "Utilisez le parcours d'import Électrification pour importer ce type de plan",
      },
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
      USER_IN_FLIGHT_JOB_EXISTS: {
        code: 'CONFLICT',
        message:
          "Vous avez déjà un import en cours : attendez qu'il se termine pour en lancer un autre",
      },
      DAILY_QUOTA_EXCEEDED: {
        code: 'TOO_MANY_REQUESTS',
        message: `La collectivité a atteint la limite de ${AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY} imports sur 24 heures, veuillez réessayer plus tard`,
      },
      TOO_MANY_IN_FLIGHT_JOBS: {
        code: 'TOO_MANY_REQUESTS',
        message: "Trop d'imports en cours, veuillez réessayer plus tard",
      },
      UNSUPPORTED_FILE_TYPE: {
        code: 'BAD_REQUEST',
        message:
          'Type de fichier non supporté (PDF, DOCX, CSV ou Excel attendus)',
      },
      ELECTRIFICATION_REQUIRES_DOCX: {
        code: 'BAD_REQUEST',
        message: "L'import Électrification nécessite un document DOCX",
      },
      FILE_TOO_LARGE: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Le fichier dépasse la taille maximale autorisée',
      },
      UNKNOWN_PLAN_TYPE: {
        code: 'BAD_REQUEST',
        message: 'Type de plan inconnu',
      },
      UNKNOWN_IMPORT_PROFILE: {
        code: 'BAD_REQUEST',
        message: "Profil d'import inconnu",
      },
      IMPORT_PROFILE_UNAVAILABLE: {
        code: 'PRECONDITION_FAILED',
        message: "Ce profil d'import n'est pas encore disponible",
      },
      UNSUPPORTED_IMPORT_CONTRACT: {
        code: 'PRECONDITION_FAILED',
        message: aiPlanImportErrorMessages.UNSUPPORTED_IMPORT_CONTRACT,
      },
      INVALID_CHECKPOINT: {
        code: 'CONFLICT',
        message: aiPlanImportErrorMessages.INVALID_CHECKPOINT,
      },
      STORAGE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "L'enregistrement du fichier source a échoué",
      },
      CREATE_PLAN_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La création du plan à importer a échoué',
      },
      ALREADY_IMPORTED: {
        code: 'CONFLICT',
        message:
          'Ce fichier a déjà été importé dans un plan de la collectivité',
      },
      JOB_NOT_RESUMABLE: {
        code: 'CONFLICT',
        message:
          "Cet import ne peut pas être repris : il n'est pas en échec, ou son point de reprise a expiré",
      },
      UNAUTHORIZED: {
        code: 'FORBIDDEN',
        message:
          "Vous n'avez pas le droit de lancer un import sur cette collectivité",
      },
    },
  };
