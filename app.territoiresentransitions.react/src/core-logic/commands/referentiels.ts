import {ActionStatusStorable} from 'storables/ActionStatusStorable';
import {
  actionStatusStore,
  getActionReferentielScoreStoreFromId,
} from 'core-logic/api/hybridStores';

const storeActionStatusAvancement = async (storable: ActionStatusStorable) => {
  await actionStatusStore.store(storable);
  const actionReferentielScoreStore = getActionReferentielScoreStoreFromId(
    storable.id
  );
  await actionReferentielScoreStore.retrieveAll(true);
};

export const referentiels = {
  storeActionStatusAvancement,
};
