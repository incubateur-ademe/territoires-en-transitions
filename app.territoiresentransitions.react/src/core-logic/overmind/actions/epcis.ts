import type {Effects} from '../effects';
import type {State} from 'core-logic/overmind/state';
import {EpciStorable} from 'storables/EpciStorable';
import {v4 as uuid} from 'uuid';

const setCurrentEpci = ({state}: {state: State}, epciId: string) => {
  state.currentEpciId = epciId;
  // TODO : Check that epci is known
  // const foundEpci = state.allEpcis.find((epci) => epci.id === epciId);
  // if (foundEpci) {
  //   state.currentEpciId = foundEpci.id;
  // } else console.log("EPCI inconnue ", epciId);
  //  else raise ?
};

const createNewEpci = async (
  {state, effects}: {state: State; effects: Effects},
  nom: string
) => {
  if (state.allEpcis.find(epciStorable => epciStorable.nom === nom))
    throw Error('Le nom de cette collectivité est déjà utilisé. ');

  const newEpci = new EpciStorable({
    uid: uuid(),
    nom: nom.trim(),
    insee: '',
    siren: '',
  });
  const stored = await effects.epciStore.store(newEpci);
  if (stored) state.allEpcis.push(stored);
};

const fetchAllEpcisFromApi = async ({
  state,
  effects,
}: {
  state: State;
  effects: Effects;
}) => {
  state.allEpcis = await effects.epciStore.api.retrieveAll();
};

export const epcisActions = {
  fetchAllEpcisFromApi,
  setCurrentEpci,
  createNewEpci,
};
