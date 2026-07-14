import {
  referentielModeGuardSpecificErrors,
  referentielNotWritableTrpcErrorEntry,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'ACTION_NOT_FOUND',
  'SNAPSHOT_UPDATE_FAILED',
  ...referentielModeGuardSpecificErrors,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateActionCommentaireErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ACTION_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'action demandée n'existe pas pour ce référentiel.",
      },
      SNAPSHOT_UPDATE_FAILED: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Impossible de mettre à jour le snapshot courant',
      },
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const UpdateActionCommentaireErrorEnum =
  createErrorsEnum(specificErrors);
export type UpdateActionCommentaireError =
  keyof typeof UpdateActionCommentaireErrorEnum;
