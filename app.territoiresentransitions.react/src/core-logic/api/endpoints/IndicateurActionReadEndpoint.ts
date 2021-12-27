import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {IndicateurActionRead} from 'generated/dataLayer/indicateur_action_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface IndicateurActionGetParams {
  indicateur_group?: 'eci' | 'cae' | 'crte';
}

class IndicateurActionReadEndpoint extends DataLayerReadCachedEndpoint<
  IndicateurActionRead,
  IndicateurActionGetParams
> {
  readonly name = 'indicateur_action';

  async _read(
    getParams: IndicateurActionGetParams
  ): Promise<PostgrestResponse<IndicateurActionRead>> {
    if (getParams.indicateur_group !== undefined)
      return this._table.eq('indicateur_group', getParams.indicateur_group);
    return this._table;
  }
}

export const indicateurActionReadEndpoint = new IndicateurActionReadEndpoint(
  []
);
