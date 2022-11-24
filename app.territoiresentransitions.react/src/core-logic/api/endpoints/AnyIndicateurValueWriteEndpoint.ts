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
      return this._table
        .upsert(
          [indicateurValue],

          {
            onConflict: 'collectivite_id,annee,indicateur_id',
          }
        )
        .select();
    }
  }
  return new AnyIndicateurValueWriteEndpoint();
};

export const makeNewIndicateurPersonnaliseResultatWriteEndpoint = () =>
  makeAnyIndicateurValueWriteEndpoint<number>(
    'indicateur_personnalise_resultat'
  );

export const makeNewIndicateurPersonnaliseObjectifWriteEndpoint = () =>
  makeAnyIndicateurValueWriteEndpoint<number>(
    'indicateur_personnalise_objectif'
  );

export const makeNewIndicateurResultatWriteEndpoint = () =>
  makeAnyIndicateurValueWriteEndpoint<string>('indicateur_resultat');

export const indicateurResultatWriteEndpoint =
  makeNewIndicateurResultatWriteEndpoint();

export const makeNewIndicateurObjectifWriteEndpoint = () =>
  makeAnyIndicateurValueWriteEndpoint<string>('indicateur_objectif');

export const indicateurObjectifWriteEndpoint =
  makeNewIndicateurObjectifWriteEndpoint();

export const indicateurPersonnaliseResultatWriteEndpoint =
  makeNewIndicateurPersonnaliseResultatWriteEndpoint();

export const indicateurPersonnaliseObjectifWriteEndpoint =
  makeNewIndicateurPersonnaliseObjectifWriteEndpoint();
