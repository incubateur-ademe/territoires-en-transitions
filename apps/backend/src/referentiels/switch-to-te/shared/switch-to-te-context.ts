import { type ReferentielResponse } from '@tet/backend/referentiels/get-referentiel/get-referentiel.service';
import { type ActionScore, type ReferentielId } from '@tet/domain/referentiels';
import { type ActionCible } from './action-cible';

export type SwitchToTeContext = {
  collectiviteId: number;
  /** refs sources en write au moment du build — dérivé des prefs, figé dans le contexte */
  sourceReferentiels: ReferentielId[];
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>;
  referentielTe: ReferentielResponse;
  teScoreMap: Map<string, ActionScore>;
  cibles: {
    /** PR12, PR13 — origines directes sur sous-action / tâche */
    sousActionsEtTaches: ActionCible[];
  };
};
