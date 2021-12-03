import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {EpciRead} from 'generated/dataLayer/epci_read';
import {PostgrestResponse} from '@supabase/supabase-js';
import {OwnedEpciRead} from 'generated/dataLayer/owned_epci_read';

class AllEpciReadEndpoint extends DataLayerReadCachedEndpoint<EpciRead, {}> {
  readonly name = 'all_epci';

  async _read(): Promise<PostgrestResponse<EpciRead>> {
    return this._table;
  }
}

export interface ActiveEpciReadParams {
  siren?: string;
}

class ActiveEpciReadEndpoint extends DataLayerReadCachedEndpoint<
  EpciRead,
  ActiveEpciReadParams
> {
  readonly name = 'active_epci';

  async _read(
    params: ActiveEpciReadParams
  ): Promise<PostgrestResponse<EpciRead>> {
    if (!params.siren) return this._table;
    return this._table.eq('siren', params.siren);
  }
}

export interface OwnedEpciReadParams {
  siren?: string;
}
class OwnedEpciReadEndpoint extends DataLayerReadCachedEndpoint<
  OwnedEpciRead,
  OwnedEpciReadParams
> {
  readonly name = 'owned_epci';

  async _read(
    params: OwnedEpciReadParams
  ): Promise<PostgrestResponse<OwnedEpciRead>> {
    if (!params.siren) return this._table;
    return this._table.eq('siren', params.siren);
  }
}

export const allEpciReadEndpoint = new AllEpciReadEndpoint([]);
export const activeEpciReadEndpoint = new ActiveEpciReadEndpoint([]);
export const ownedEpciReadEndpoint = new OwnedEpciReadEndpoint([]);
