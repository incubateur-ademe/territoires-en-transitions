import {DataLayerReadEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {AnyIndicateurValueWrite} from 'generated/dataLayer/any_indicateur_value_write';

export interface IndicateurResultatGetParams {
  collectivite_id: number;
  indicateur_id?: string;
}

// class IndicateurResultatReadEndpoint extends DataLayerReadEndpoint<
//   AnyIndicateurValueWrite,
//   IndicateurResultatGetParams
// > {
//   readonly name = 'indicateur_resultat';
//   async _read(
//     getParams: IndicateurResultatGetParams
//   ): Promise<PostgrestResponse<AnyIndicateurValueWrite>> {
//     if (getParams.indicateur_id)
//       return this._table
//         .eq('collectivite_id', getParams.collectivite_id)
//         .eq('indicateur_id', getParams.indicateur_id);
//     return this._table.eq('collectivite_id', getParams.collectivite_id);
//   }
// }

const makeAnyIndicateurValueReadEndpoint = (
  table_name: string
): DataLayerReadEndpoint<
  AnyIndicateurValueWrite,
  IndicateurResultatGetParams
> => {
  class AnyIndicateurValueReadEndpoint extends DataLayerReadEndpoint<
    AnyIndicateurValueWrite,
    IndicateurResultatGetParams
  > {
    readonly name = table_name;
    async _read(
      getParams: IndicateurResultatGetParams
    ): Promise<PostgrestResponse<AnyIndicateurValueWrite>> {
      if (getParams.indicateur_id)
        return this._table
          .eq('collectivite_id', getParams.collectivite_id)
          .eq('indicateur_id', getParams.indicateur_id);
      return this._table.eq('collectivite_id', getParams.collectivite_id);
    }
  }
  return new AnyIndicateurValueReadEndpoint();
};

export const makeNewIndicateurResultatReadEndpoint = () =>
  makeAnyIndicateurValueReadEndpoint('indicateur_resultat');

export const indicateurResultatReadEndpoint =
  makeNewIndicateurResultatReadEndpoint();
