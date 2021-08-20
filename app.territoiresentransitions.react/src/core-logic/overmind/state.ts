import {ActionReferentielScoreInterface} from 'generated/models/action_referentiel_score';
import {EpciStorable} from 'storables/EpciStorable';
import {Avancement} from 'types';
import {IndicateurValueStorable} from 'storables/IndicateurValueStorable';
import {FicheActionStorable} from 'storables/FicheActionStorable';
import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';

export type State = {
  currentEpciId?: string;
  allEpcis: EpciStorable[];
  allIndicateurValues: Map<string, IndicateurValueStorable>;
  allFiches: Map<string, FicheActionStorable>;
  allFicheCategories: Map<string, FicheActionCategorieStorable>;
  actionReferentielScoresById: Record<string, ActionReferentielScoreInterface>;
  actionReferentielStatusAvancementById: Record<string, Avancement>;
  actionReferentielCommentaireById: Record<string, string>;
};

export const state: State = {
  currentEpciId: undefined,
  allEpcis: [],
  allIndicateurValues: new Map<string, IndicateurValueStorable>(),
  allFiches: new Map<string, FicheActionStorable>(),
  allFicheCategories: new Map<string, FicheActionCategorieStorable>(),
  actionReferentielScoresById: {},
  actionReferentielStatusAvancementById: {},
  actionReferentielCommentaireById: {},
};
