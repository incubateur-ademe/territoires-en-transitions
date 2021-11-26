import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {EpciRead} from 'generated/dataLayer/epci_read';
import {PostgrestResponse} from '@supabase/supabase-js';

class EpciReadEndpoint extends DataLayerReadCachedEndpoint<EpciRead, {}> {
  readonly name = 'client_epci';

  async _read(): Promise<PostgrestResponse<EpciRead>> {
    return this._table;
  }
}

export const epciReadEndpoint = new EpciReadEndpoint([]);
