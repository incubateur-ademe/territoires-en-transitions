import {planActionStore} from 'core-logic/api/hybridStores';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {v4 as uuid} from 'uuid';

const createPlanAction = async (epci_id: string, nom: string) => {
  await planActionStore.store(
    new PlanActionStorable({
      epci_id,
      nom,
      uid: uuid(),
      fiches_by_category: [],
      categories: [],
    })
  );
};

export const plans = {
  createPlanAction,
};
