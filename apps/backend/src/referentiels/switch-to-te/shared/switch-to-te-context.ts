import { type FicheActionLink } from '@tet/backend/plans/fiches/update-fiche/fiche-action-link.repository';
import { type ReferentielResponse } from '@tet/backend/referentiels/get-referentiel/get-referentiel.service';
import { type PersonneId } from '@tet/domain/collectivites';
import {
  type ActionScore,
  type ActionType,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { type ActionCible } from './action-cible';
import { type CorrespondanceOrigineCibleIndexes } from './correspondance-origine-cible';

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
  sourceFicheLinks: FicheActionLink[];
  /** index origine → cible TE, pré-calculé depuis les cibles */
  correspondanceIndexes: CorrespondanceOrigineCibleIndexes;
  cibles: {
    mesures: ActionCible[];
    sousActionsEtTaches: ActionCible[];
  };
};
