import * as actions from "./actions";
import { effects } from "./effects";
import { state } from "./state";
import { createOvermind } from "overmind";

export const config = {
  state: state,
  actions: actions,
  effects: effects,
};

// epciStore.retrieveAll().then((allEpcis) => {
//   state.allEpcis = allEpcis;
//   state.epciDataIsLoading = false;
// });

export const overmind = createOvermind(config, { devtools: false });
