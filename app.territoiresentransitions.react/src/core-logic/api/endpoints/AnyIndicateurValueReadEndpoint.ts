import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {AnyIndicateurValueRead} from 'generated/dataLayer/any_indicateur_value_write';

export interface AnyIndicateurValueGetParams {
  collectiviteId: number;
}

const makeAnyIndicateurValueReadEndpoint = (
  table_name: string
): DataLayerReadCachedEndpoint<
  AnyIndicateurValueRead,
  AnyIndicateurValueGetParams
> => {
  class AnyIndicateurValueReadEndpoint extends DataLayerReadCachedEndpoint<
    AnyIndicateurValueRead,
    AnyIndicateurValueGetParams
  > {
    readonly name = table_name;
    async _read(
      getParams: AnyIndicateurValueGetParams
    ): Promise<PostgrestResponse<AnyIndicateurValueRead>> {
      return this._table.eq('collectivite_id', getParams.collectiviteId);
    }
  }
  return new AnyIndicateurValueReadEndpoint([]);
};

export const makeNewIndicateurResultatReadEndpoint = () =>
  makeAnyIndicateurValueReadEndpoint('indicateur_resultat');

export const indicateurResultatReadEndpoint =
  makeNewIndicateurResultatReadEndpoint();

export const makeNewIndicateurObjectifReadEndpoint = () =>
  makeAnyIndicateurValueReadEndpoint('indicateur_objectif');

export const indicateurObjectifReadEndpoint =
  makeNewIndicateurObjectifReadEndpoint();
