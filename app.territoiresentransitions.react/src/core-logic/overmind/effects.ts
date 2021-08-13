import type { HybridStore } from "core-logic/api/hybridStore";
import {
  epciStore,
  actionStatusStore,
  actionReferentielScoreStore,
} from "core-logic/api/hybridStores";
import { ActionReferentielScoreStorable } from "storables/ActionReferentielScoreStorable";
import { ActionStatusStorable } from "storables/ActionStatusStorable";
import { EpciStorable } from "storables/EpciStorable";

export type Effects = {
  epciStore: HybridStore<EpciStorable>;
  actionStatusStore: HybridStore<ActionStatusStorable>;
  actionReferentielScoreStore: HybridStore<ActionReferentielScoreStorable>;
};

export const effects: Effects = {
  epciStore,
  actionStatusStore,
  actionReferentielScoreStore,
};
