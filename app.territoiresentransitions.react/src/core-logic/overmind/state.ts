import { ActionReferentielScore } from "generated/models/action_referentiel_score";
import { EpciStorable } from "storables/EpciStorable";

export type State = {
  epciId?: string;
  epciDataIsLoading: boolean;
  allEpcis: EpciStorable[];
  actionReferentielScoresById: Record<string, ActionReferentielScore>;
};

export const state: State = {
  epciId: undefined,
  epciDataIsLoading: false,
  allEpcis: [],
  actionReferentielScoresById: {},
};
