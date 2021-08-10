import { HybridStore } from "core-logic/api/hybridStore";
import { epciStore } from "core-logic/api/hybridStores";
import { EpciStorable } from "storables/EpciStorable";

export type Effects = {
  epciStore: HybridStore<EpciStorable>;
};

export const effects: Effects = {
  epciStore,
};
