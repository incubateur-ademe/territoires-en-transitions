import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';
import {PostgrestResponse} from '@supabase/supabase-js';

export class ActionStatutWriteEndpoint extends DataLayerWriteEndpoint<ActionStatutWrite> {
  readonly name = 'action_statut';

  async _write(
    statut: ActionStatutWrite
  ): Promise<PostgrestResponse<ActionStatutWrite>> {
    return this._table
      .upsert([statut], {
        onConflict: 'collectivite_id,action_id',
      })
      .select();
  }
}

export const actionStatutWriteEndpoint = new ActionStatutWriteEndpoint();
