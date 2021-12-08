import {DataLayerReadEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {AllCollectiviteRead} from 'generated/dataLayer/all_collectivite_read';
import {PostgrestResponse} from '@supabase/supabase-js';
import {OwnedCollectiviteRead} from 'generated/dataLayer/owned_collectivite_read';
import {ElsesCollectiviteRead} from 'generated/dataLayer';

class AllCollectiviteReadEndpoint extends DataLayerReadEndpoint<
  AllCollectiviteRead,
  {}
> {
  readonly name = 'all_collectivite';

  async _read(): Promise<PostgrestResponse<AllCollectiviteRead>> {
    return this._table;
  }
}

export interface ElsesCollectiviteReadParams {
  id?: number;
}

class ElsesCollectiviteReadEndpoint extends DataLayerReadEndpoint<
  ElsesCollectiviteRead,
  ElsesCollectiviteReadParams
> {
  readonly name = 'elses_collectivite';

  async _read(
    params: ElsesCollectiviteReadParams
  ): Promise<PostgrestResponse<ElsesCollectiviteRead>> {
    if (!params.id) return this._table;
    return this._table.eq('id', params.id);
  }
}

export interface OwnedCollectiviteReadParams {
  id?: number;
}
class OwnedCollectiviteReadEndpoint extends DataLayerReadEndpoint<
  OwnedCollectiviteRead,
  OwnedCollectiviteReadParams
> {
  readonly name = 'owned_collectivite';

  async _read(
    params: OwnedCollectiviteReadParams
  ): Promise<PostgrestResponse<OwnedCollectiviteRead>> {
    if (!params.id) return this._table;
    return this._table.eq('id', params.id);
  }
}

export const allCollectiviteReadEndpoint = new AllCollectiviteReadEndpoint();
export const elsesCollectiviteReadEndpoint =
  new ElsesCollectiviteReadEndpoint();
export const ownedCollectiviteReadEndpoint =
  new OwnedCollectiviteReadEndpoint();
