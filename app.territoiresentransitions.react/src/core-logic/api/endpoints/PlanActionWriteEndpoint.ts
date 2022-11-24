import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PlanActionWrite} from 'generated/dataLayer/plan_action_write';
import {PostgrestResponse} from '@supabase/supabase-js';

export class PlanActionWriteEndpoint extends DataLayerWriteEndpoint<PlanActionWrite> {
  readonly name = 'plan_action';

  async _write(
    commentaire: PlanActionWrite
  ): Promise<PostgrestResponse<PlanActionWrite>> {
    return this._table.upsert([commentaire], {onConflict: 'uid'}).select();
  }
}

export const planActionWriteEndpoint = new PlanActionWriteEndpoint();
