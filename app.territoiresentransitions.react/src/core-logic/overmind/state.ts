import { ActionReferentielScoreInterface } from "generated/models/action_referentiel_score";
import { EpciStorable } from "storables/EpciStorable";
import { Avancement } from "types";

export type State = {
  epciId?: string;
  epciDataIsLoading: boolean;
  allEpcis: EpciStorable[];
  actionReferentielScoresById: Record<string, ActionReferentielScoreInterface>;
  actionReferentielStatusAvancementById: Record<string, Avancement>;
};

export const state: State = {
  epciId: undefined,
  epciDataIsLoading: false,
  allEpcis: [],
  actionReferentielScoresById: {},
  actionReferentielStatusAvancementById: {},
};
