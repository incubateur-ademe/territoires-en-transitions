import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface IndicateurDefinitionGetParams {
  indicateur_id?: string;
  indicateur_group?: 'eci' | 'cae' | 'crte';
}

class IndicateurDefinitionReadEndpoint extends DataLayerReadCachedEndpoint<
  IndicateurDefinitionRead,
  IndicateurDefinitionGetParams
> {
  readonly name = 'indicateur_definition';

  async _read(
    getParams: IndicateurDefinitionGetParams
  ): Promise<PostgrestResponse<IndicateurDefinitionRead>> {
    if (getParams.indicateur_id !== undefined)
      return this._table.eq('id', getParams.indicateur_id);
    else if (getParams.indicateur_group !== undefined)
      return this._table.eq('indicateur_group', getParams.indicateur_group);
    return this._table.order('identifiant', {ascending: true});
  }
}

export const indicateurDefinitionReadEndpoint =
  new IndicateurDefinitionReadEndpoint([]);
