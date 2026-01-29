import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { requestLabellisationRulesErrors } from '@tet/domain/referentiels';

const specificErrors = [
  ...requestLabellisationRulesErrors,
  'DEMANDE_NOT_FOUND',
  'DATABASE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const requestLabellisationErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ETOILE_NOT_ALLOWED_FOR_AUDIT_ONLY: {
        code: 'BAD_REQUEST',
        message:
          'On ne peut pas demander une étoile pour un audit seul sans labellisation.',
      },
      MISSING_ETOILE_FOR_LABELLISATION: {
        code: 'BAD_REQUEST',
        message:
          'Une étoile de labellisation est requise pour demander un audit avec labellisation.',
      },
      AUDIT_COT_NOT_ALLOWED_FOR_COLLECTIVITE_NOT_COT: {
        code: 'BAD_REQUEST',
        message:
          'Un audit COT ne peut être demandé par une collectivité non COT.',
      },
      REFERENTIEL_NOT_COMPLETED: {
        code: 'BAD_REQUEST',
        message:
          'Le référentiel doit être entièrement rempli pour demander un audit ou une labellisation.',
      },
      AUDIT_ALREADY_REQUESTED: {
        code: 'BAD_REQUEST',
        message:
          'Un audit ou une labellisation a déjà été demandé pour cette collectivité.',
      },
      SCORE_GLOBAL_CRITERIA_NOT_SATISFIED: {
        code: 'BAD_REQUEST',
        message:
          "Le critère de score global n'est pas atteint pour demander ce niveau de labellisation.",
      },
      SCORE_ACTIONS_CRITERIA_NOT_SATISFIED: {
        code: 'BAD_REQUEST',
        message:
          "Un ou plusieurs critères d'action ne sont pas atteints pour demander ce niveau de labellisation.",
      },
      MISSING_FILE: {
        code: 'BAD_REQUEST',
        message:
          'Un fichier est requis pour demander un audit ou une labellisation.',
      },
      DEMANDE_NOT_FOUND: {
        code: 'BAD_REQUEST',
        message:
          "Aucune demande de labellisation ou d'audit trouvée pour cette collectivité.",
      },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Une erreur de base de données s'est produite lors de la soumission de la demande",
      },
    },
  };

export const RequestLabellisationErrorEnum = createErrorsEnum(specificErrors);
export type RequestLabellisationError =
  keyof typeof RequestLabellisationErrorEnum;
