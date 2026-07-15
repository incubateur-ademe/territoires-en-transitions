import { type ReferentielResponse } from '@tet/backend/referentiels/get-referentiel/get-referentiel.service';
import {
  type ActionScore,
  type ActionType,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { type PersonneId } from '@tet/domain/collectivites';
import { type ActionCible } from './action-cible';

export type SwitchToTeContext = {
  collectiviteId: number;
  /** refs sources en write au moment du build — dérivé des prefs, figé dans le contexte */
  sourceReferentiels: ReferentielId[];
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>;
  referentielTe: ReferentielResponse;
  teScoreMap: Map<string, ActionScore>;
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>;
  pilotesByMesureActionId: Map<string, PersonneId[]>;
  servicesByMesureActionId: Map<string, number[]>;
  cibles: {
    /** PR12, PR13 — origines directes sur sous-action / tâche */
    sousActionsEtTaches: ActionCible[];
    /** PR14+ — origines agrégées au niveau mesure TE */
    mesures: ActionCible[];
  };
};
