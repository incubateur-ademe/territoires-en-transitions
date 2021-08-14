import { ActionReferentielScoreInterface } from "generated/models/action_referentiel_score";
import { EpciStorable } from "storables/EpciStorable";
import { Avancement } from "types";

export type State = {
  currentEpciId?: string;
  allEpcis: EpciStorable[];
  actionReferentielScoresById: Record<string, ActionReferentielScoreInterface>;
  actionReferentielStatusAvancementById: Record<string, Avancement>;
  actionReferentielCommentaireById: Record<string, string>;
};

export const state: State = {
  currentEpciId: undefined,
  allEpcis: [],
  actionReferentielScoresById: {},
  actionReferentielStatusAvancementById: {},
  actionReferentielCommentaireById: {},
};
