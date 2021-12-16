import {DataLayerReadEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {AnyIndicateurValueWrite} from 'generated/dataLayer/any_indicateur_value_write';

export interface AnyIndicateurValueGetParams {
  collectiviteId: number;
  indicateurId: string;
  annee?: number;
}

const makeAnyIndicateurValueReadEndpoint = (
  table_name: string
): DataLayerReadEndpoint<
  AnyIndicateurValueWrite,
  AnyIndicateurValueGetParams
> => {
  class AnyIndicateurValueReadEndpoint extends DataLayerReadEndpoint<
    AnyIndicateurValueWrite,
    AnyIndicateurValueGetParams
  > {
    readonly name = table_name;
    async _read(
      getParams: AnyIndicateurValueGetParams
    ): Promise<PostgrestResponse<AnyIndicateurValueWrite>> {
      if (getParams.annee)
        return this._table
          .eq('collectivite_id', getParams.collectiviteId)
          .eq('annee', getParams.annee);
      return this._table
        .eq('collectivite_id', getParams.collectiviteId)
        .eq('indicateur_id', getParams.indicateurId);
    }
  }
  return new AnyIndicateurValueReadEndpoint();
};

export const makeNewIndicateurResultatReadEndpoint = () =>
  makeAnyIndicateurValueReadEndpoint('indicateur_resultat');

export const indicateurResultatReadEndpoint =
  makeNewIndicateurResultatReadEndpoint();

export const makeNewIndicateurObjectifReadEndpoint = () =>
  makeAnyIndicateurValueReadEndpoint('indicateur_objectif');

export const indicateurObjectifReadEndpoint =
  makeNewIndicateurObjectifReadEndpoint();
