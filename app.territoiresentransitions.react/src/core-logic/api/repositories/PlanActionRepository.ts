import {planActionReadEndpoint} from 'core-logic/api/endpoints/PlanActionReadEndpoint';
import {PlanActionRead} from 'generated/dataLayer/plan_action_read';
import {PlanActionWrite} from 'generated/dataLayer/plan_action_write';
import {planActionWriteEndpoint} from 'core-logic/api/endpoints/PlanActionWriteEndpoint';

class PlanActionRepository {
  save(commentaire: PlanActionWrite): Promise<PlanActionWrite | null> {
    return planActionWriteEndpoint.save(commentaire);
  }

  async fetchAll(args: {collectiviteId: number}): Promise<PlanActionRead[]> {
    const results = await planActionReadEndpoint.getBy({
      collectivite_id: args.collectiviteId,
    });
    return results;
  }
}

export const planActionRepository = new PlanActionRepository();
