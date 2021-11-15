import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';
import {PostgrestResponse} from '@supabase/supabase-js';
import {ActionStatutRead} from 'generated/dataLayer/action_statut_read';

export class ActionStatutWriteEndpoint extends DataLayerWriteEndpoint<ActionStatutWrite> {
  async _write(
    statut: ActionStatutWrite
  ): Promise<PostgrestResponse<ActionStatutRead>> {
    return this._table.upsert([statut]);
  }
}
