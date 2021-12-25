import {
  DataLayerReadCachedEndpoint,
  DataLayerWriteEndpoint,
} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {
  AnyIndicateurValueRead,
  AnyIndicateurValueWrite,
} from 'generated/dataLayer/any_indicateur_value_write';
import {
  indicateurObjectifWriteEndpoint,
  indicateurResultatWriteEndpoint,
  indicateurPersonnaliseObjectifWriteEndpoint,
  indicateurPersonnaliseResultatWriteEndpoint,
} from 'core-logic/api/endpoints/AnyIndicateurValueWriteEndpoint';

export interface AnyIndicateurValueGetParams {
  collectiviteId: number;
}

const makeAnyIndicateurValueReadEndpoint = <T extends string | number>(
  table_name: string,
  writeEndpoint: DataLayerWriteEndpoint<AnyIndicateurValueWrite<T>>
): DataLayerReadCachedEndpoint<
  AnyIndicateurValueRead<T>,
  AnyIndicateurValueGetParams
> => {
  class AnyIndicateurValueReadEndpoint extends DataLayerReadCachedEndpoint<
    AnyIndicateurValueRead<T>,
    AnyIndicateurValueGetParams
  > {
    readonly name = table_name;
    async _read(
      getParams: AnyIndicateurValueGetParams
    ): Promise<PostgrestResponse<AnyIndicateurValueRead<T>>> {
      return this._table.eq('collectivite_id', getParams.collectiviteId);
    }
  }
  return new AnyIndicateurValueReadEndpoint([writeEndpoint]);
};

export const makeNewIndicateurResultatReadEndpoint = () =>
  makeAnyIndicateurValueReadEndpoint<string>(
    'indicateur_resultat',
    indicateurResultatWriteEndpoint
  );
export const indicateurObjectifReadEndpoint =
  makeAnyIndicateurValueReadEndpoint(
    'indicateur_objectif',
    indicateurObjectifWriteEndpoint
  );
export const indicateurPersonnaliseResultatReadEndpoint =
  makeAnyIndicateurValueReadEndpoint(
    'indicateur_personnalise_resultat',
    indicateurPersonnaliseResultatWriteEndpoint
  );
export const indicateurPersonnaliseObjectifReadEndpoint =
  makeAnyIndicateurValueReadEndpoint(
    'indicateur_personnalise_objectif',
    indicateurPersonnaliseObjectifWriteEndpoint
  );
