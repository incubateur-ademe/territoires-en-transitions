import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {AnyIndicateurValueWrite} from 'generated/dataLayer/any_indicateur_value_write';
import {PostgrestResponse} from '@supabase/supabase-js';

const makeAnyIndicateurValueWriteEndpoint = <T extends string | number>(
  tableName: string
): DataLayerWriteEndpoint<AnyIndicateurValueWrite<T>> => {
  class AnyIndicateurValueWriteEndpoint extends DataLayerWriteEndpoint<
    AnyIndicateurValueWrite<T>
  > {
    readonly name = tableName;

    async _write(
      indicateurValue: AnyIndicateurValueWrite<T>
    ): Promise<PostgrestResponse<AnyIndicateurValueWrite<T>>> {
      return this._table.upsert([indicateurValue]); // {onConflict: 'valeur'}
    }
  }
  return new AnyIndicateurValueWriteEndpoint();
};

export const makeNewIndicateurResultatWriteEndpoint = () =>
  makeAnyIndicateurValueWriteEndpoint<string>('indicateur_resultat');

export const indicateurResultatWriteEndpoint =
  makeNewIndicateurResultatWriteEndpoint();

export const makeNewIndicateurObjectifWriteEndpoint = () =>
  makeAnyIndicateurValueWriteEndpoint<string>('indicateur_objectif');

export const indicateurObjectifWriteEndpoint =
  makeNewIndicateurObjectifWriteEndpoint();
