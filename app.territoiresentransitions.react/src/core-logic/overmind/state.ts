import {ActionReferentielScoreInterface} from 'generated/models/action_referentiel_score';
import {EpciStorable} from 'storables/EpciStorable';
import {Avancement} from 'types';
import {IndicateurValueStorable} from '../../storables/IndicateurValueStorable';

export type State = {
  currentEpciId?: string;
  allEpcis: EpciStorable[];
  allIndicateurValues: Map<string, IndicateurValueStorable>;
  actionReferentielScoresById: Record<string, ActionReferentielScoreInterface>;
  actionReferentielStatusAvancementById: Record<string, Avancement>;
  actionReferentielCommentaireById: Record<string, string>;
};

export const state: State = {
  currentEpciId: undefined,
  allEpcis: [],
  allIndicateurValues: new Map<string, IndicateurValueStorable>(),
  actionReferentielScoresById: {},
  actionReferentielStatusAvancementById: {},
  actionReferentielCommentaireById: {},
};
