import {
  referentielModeGuardSpecificErrors,
  referentielNotWritableTrpcErrorEntry,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'MIXED_REFERENTIELS',
  'INVALID_ACTION_ID',
  'INVALID_VALEUR_SELECTION',
  'INDICATEUR_PERIODICITE_NOT_SUPPORTED',
  'INDICATEUR_EXPRESSION_ERROR',
  'COLLECTIVITE_LOAD_ERROR',
  'REFERENTIEL_DEFINITION_ERROR',
  'PERSONNALISATION_REPONSES_ERROR',
  'VALEURS_REFERENCE_ERROR',
  ...referentielModeGuardSpecificErrors,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const scoreIndicatifErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      MIXED_REFERENTIELS: {
        code: 'BAD_REQUEST',
        message:
          "Les actions fournies appartiennent à plusieurs référentiels différents. Veuillez fournir des actions d'un seul référentiel.",
      },
      INVALID_VALEUR_SELECTION: {
        code: 'BAD_REQUEST',
        message:
          'Chaque valeur du score indicatif doit être annuelle et appartenir à la définition et à la collectivité demandées.',
      },
      INDICATEUR_PERIODICITE_NOT_SUPPORTED: {
        code: 'BAD_REQUEST',
        message:
          'Le score indicatif ne prend en charge que les indicateurs annuels.',
      },
      INVALID_ACTION_ID: {
        code: 'BAD_REQUEST',
        message: "L'identifiant d'action référentiel est invalide",
      },
      INDICATEUR_EXPRESSION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Impossible d'extraire les indicateurs sources de la formule.",
      },
      COLLECTIVITE_LOAD_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Impossible de charger l'identité de la collectivité.",
      },
      REFERENTIEL_DEFINITION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Impossible de charger la définition du référentiel.',
      },
      PERSONNALISATION_REPONSES_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Impossible de charger les réponses de personnalisation.',
      },
      VALEURS_REFERENCE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Impossible de charger les valeurs de référence.',
      },
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const ScoreIndicatifErrorEnum = createErrorsEnum(specificErrors);
export type ScoreIndicatifError = keyof typeof ScoreIndicatifErrorEnum;
