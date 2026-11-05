import {
  ScoreIndicatifError,
  scoreIndicatifTrpcErrorEntries,
} from '@tet/backend/referentiels/score-indicatif/score-indicatif.errors';
import {
  UpdateIndicateurError,
  updateIndicateurTrpcErrorEntries,
} from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/update-indicateur.errors';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import {
  UpdateActionStatutError,
  updateActionStatutTrpcErrorEntries,
} from '../update-action-statut/update-action-statut.errors';

/**
 * La procédure enchaîne l'enregistrement de la valeur d'indicateur et
 * l'écriture du statut : elle renvoie donc les erreurs des deux features.
 */
export type SetScoreFromIndicateurError =
  | ScoreIndicatifError
  | UpdateActionStatutError
  | UpdateIndicateurError;

type SpecificError = Exclude<SetScoreFromIndicateurError, CommonError>;

export const setScoreFromIndicateurErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ...scoreIndicatifTrpcErrorEntries,
      ...updateActionStatutTrpcErrorEntries,
      ...updateIndicateurTrpcErrorEntries,
    },
  };
