import type { Effects } from "./effects";
import type { State } from "core-logic/overmind/state";
import { EpciStorable } from "storables/EpciStorable";
import { v4 as uuid } from "uuid";
import type { Avancement } from "types";
import { ActionStatusStorable } from "storables/ActionStatusStorable";

export const setCurrentEpci = (
  { state, effects }: { state: State; effects: Effects },
  epciId: string,
) => {
  state.epciId = epciId;
  fetchStatesFromApiForThisEpci({ state, effects });
};

export const createNewEpci = async (
  { state, effects }: { state: State; effects: Effects },
  nom: string,
) => {
  if (state.allEpcis.find((epciStorable) => epciStorable.nom === nom))
    throw Error("Le nom de cette collectivité est déjà utilisé. ");

  const newEpci = new EpciStorable({
    uid: uuid(),
    nom: nom.trim(),
    insee: "",
    siren: "",
  });
  const stored = await effects.epciStore.store(newEpci);
  if (stored) state.allEpcis.push(stored);
};

export const fetchAllActionReferentielScoresFromApi = async ({
  state,
  effects,
}: {
  state: State;
  effects: Effects;
}) => {
  const allActionReferentielScores =
    await effects.actionReferentielScoreStore.api.retrieveAll();

  allActionReferentielScores.forEach((score) => {
    state.actionReferentielScoresById[score.action_id] = score;
  });
};

export const fetchAllActionReferentieLStatusAvancementFromApi = async ({
  state,
  effects,
}: {
  state: State;
  effects: Effects;
}) => {
  const allActionReferentielStatuses =
    await effects.actionStatusStore.retrieveAll();

  allActionReferentielStatuses.forEach((status) => {
    state.actionReferentielStatusAvancementById[status.action_id] =
      status.avancement;
  });
};

export const updateActionReferentielAvancement = async (
  {
    state,
    effects,
  }: {
    state: State;
    effects: Effects;
  },
  { actionId, avancement }: { actionId: string; avancement: Avancement },
) => {
  if (state.epciId) {
    const actionStatusStorable = new ActionStatusStorable({
      action_id: actionId,
      avancement: avancement,
      epci_id: state.epciId,
    });
    const updatedStatus = await effects.actionStatusStore.store(
      actionStatusStorable,
    );
    state.actionReferentielStatusAvancementById[actionId] =
      updatedStatus.avancement;
    await fetchAllActionReferentielScoresFromApi({ state, effects });
    // TODO / Question : Je trouve ça troublant que le "avancement" de status et de score pour une même action ne soit pas les mêmes (pour programmee par ex.) Revoir la logique, nan ?
  }
};

const fetchStatesFromApiForThisEpci = async ({
  state,
  effects,
}: {
  state: State;
  effects: Effects;
}) => {
  await fetchAllActionReferentieLStatusAvancementFromApi({ state, effects });
  await fetchAllActionReferentielScoresFromApi({ state, effects });
};

export const onInitializeOvermind = async ({
  state,
  effects,
}: {
  state: State;
  effects: Effects;
}) => {
  state.allEpcis = await effects.epciStore.retrieveAll();
  await fetchStatesFromApiForThisEpci({ state, effects });
};
