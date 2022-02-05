import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PlanActionRead} from 'generated/dataLayer/plan_action_read';
import {PostgrestResponse} from '@supabase/supabase-js';
import {planActionWriteEndpoint} from 'core-logic/api/endpoints/PlanActionWriteEndpoint';

export interface PlanGetParams {
  collectivite_id: number;
  plan_action_uid?: string;
}

export class PlanActionReadEndpoint extends DataLayerReadCachedEndpoint<
  PlanActionRead,
  PlanGetParams
> {
  readonly name = 'plan_action';

  async _read(
    getParams: PlanGetParams
  ): Promise<PostgrestResponse<PlanActionRead>> {
    if (getParams.plan_action_uid)
      return this._table
        .eq('collectivite_id', getParams.collectivite_id)
        .eq('uid', getParams.plan_action_uid);
    return this._table.eq('collectivite_id', getParams.collectivite_id);
  }
}

export const planActionReadEndpoint = new PlanActionReadEndpoint([
  planActionWriteEndpoint,
]);
