import {ActionStatusStorable} from 'storables/ActionStatusStorable';
import {
  actionStatusStore,
  actionReferentielScoreStore,
} from 'core-logic/api/hybridStores';

const storeActionStatusAvancement = async (storable: ActionStatusStorable) => {
  await actionStatusStore.store(storable);
  await actionReferentielScoreStore.retrieveAll(true);
};

export const referentiels = {
  storeActionStatusAvancement,
};
