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
      INVALID_ACTION_ID: {
        code: 'BAD_REQUEST',
        message: "L'identifiant d'action référentiel est invalide",
      },
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const ScoreIndicatifErrorEnum = createErrorsEnum(specificErrors);
export type ScoreIndicatifError = keyof typeof ScoreIndicatifErrorEnum;
