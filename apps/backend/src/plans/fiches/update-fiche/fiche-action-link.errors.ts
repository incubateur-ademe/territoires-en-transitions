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
  'FICHE_NOT_FOUND',
  'FICHE_COLLECTIVITE_MISMATCH',
  'INVALID_ACTION_ID',
  ...referentielModeGuardSpecificErrors,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateActionFichesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ACTION_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'action référentielle demandée n'existe pas",
      },
      FICHE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Au moins une fiche fournie n'existe pas",
      },
      FICHE_COLLECTIVITE_MISMATCH: {
        code: 'BAD_REQUEST',
        message:
          'Les fiches fournies doivent toutes appartenir à la même collectivité',
      },
      INVALID_ACTION_ID: {
        code: 'BAD_REQUEST',
        message: "L'identifiant d'action référentiel est invalide",
      },
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const UpdateActionFichesErrorEnum = createErrorsEnum(specificErrors);
export type UpdateActionFichesError = keyof typeof UpdateActionFichesErrorEnum;
