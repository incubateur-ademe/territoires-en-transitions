import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {AnyIndicateurValueWrite} from 'generated/dataLayer/any_indicateur_value_write';
import {PostgrestResponse} from '@supabase/supabase-js';

const makeAnyIndicateurValueWriteEndpoint = (
  tableName: string
): DataLayerWriteEndpoint<AnyIndicateurValueWrite> => {
  class AnyIndicateurValueWriteEndpoint extends DataLayerWriteEndpoint<AnyIndicateurValueWrite> {
    readonly name = tableName;

    async _write(
      indicateurValue: AnyIndicateurValueWrite
    ): Promise<PostgrestResponse<AnyIndicateurValueWrite>> {
      return this._table.upsert([indicateurValue]);
    }
  }
  return new AnyIndicateurValueWriteEndpoint();
};

export const makeNewIndicateurResultatWriteEndpoint = () =>
  makeAnyIndicateurValueWriteEndpoint('indicateur_resultat');
export const indicateurResultatWriteEndpoint =
  makeNewIndicateurResultatWriteEndpoint();
