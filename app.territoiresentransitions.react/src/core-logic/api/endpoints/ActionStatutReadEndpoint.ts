import {DataLayerReadEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface StatutGetParams {
  epci_id: string;
}

export class ActionStatutReadEndpoint extends DataLayerReadEndpoint<
  ActionStatutWrite,
  StatutGetParams
> {
  async query(
    getParams: StatutGetParams
  ): Promise<PostgrestResponse<ActionStatutWrite>> {
    return this._table.eq('epci_id', getParams.epci_id);
  }
}
