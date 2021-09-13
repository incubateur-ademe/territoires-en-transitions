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
  console.log(
    '[Command retrieve all] Store endpoint url is ',
    actionReferentielScoreStore.api.lastResponse?.url
  );
  await actionReferentielScoreStore.retrieveAll(true);
};

export const referentiels = {
  storeActionStatusAvancement,
};
