import type { Effects } from "./effects";
import { State } from "core-logic/overmind/state";
import { EpciStorable } from "storables/EpciStorable";
import { v4 as uuid } from "uuid";

export const setCurrentEpci = ({ state }: { state: State }, epciId: string) => {
  state.epciId = epciId;
  console.log("set current epci in store ");
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

export const onInitializeOvermind = async ({
  state,
  effects,
}: {
  state: State;
  effects: Effects;
}) => {
  state.allEpcis = await effects.epciStore.retrieveAll();
};
