import {DataLayerReadEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {MesCollectivitesRead} from 'generated/dataLayer/mes_collectivites_read';
import {ElsesCollectiviteRead} from 'generated/dataLayer';
import {NamedCollectiviteRead} from 'generated/dataLayer/named_collectivite_read';

class NamedCollectiviteReadEndpoint extends DataLayerReadEndpoint<
  NamedCollectiviteRead,
  {}
> {
  readonly name = 'named_collectivite';

  async _read(): Promise<PostgrestResponse<NamedCollectiviteRead>> {
    return this._table;
  }
}

export interface ElsesCollectiviteReadParams {
  collectivite_id?: number;
}

class ElsesCollectiviteReadEndpoint extends DataLayerReadEndpoint<
  ElsesCollectiviteRead,
  ElsesCollectiviteReadParams
> {
  readonly name = 'elses_collectivite';

  async _read(
    params: ElsesCollectiviteReadParams
  ): Promise<PostgrestResponse<ElsesCollectiviteRead>> {
    if (!params.collectivite_id) return this._table;
    return this._table.eq('collectivite_id', params.collectivite_id);
  }
}

export interface OwnedCollectiviteReadParams {
  collectivite_id?: number;
}

class OwnedCollectiviteReadEndpoint extends DataLayerReadEndpoint<
  MesCollectivitesRead,
  OwnedCollectiviteReadParams
> {
  readonly name = 'mes_collectivites';

  async _read(
    params: OwnedCollectiviteReadParams
  ): Promise<PostgrestResponse<MesCollectivitesRead>> {
    if (!params.collectivite_id) return this._table;
    return this._table.eq('collectivite_id', params.collectivite_id);
  }
}

export const allCollectiviteReadEndpoint = new NamedCollectiviteReadEndpoint();
export const elsesCollectiviteReadEndpoint =
  new ElsesCollectiviteReadEndpoint();
export const ownedCollectiviteReadEndpoint =
  new OwnedCollectiviteReadEndpoint();
