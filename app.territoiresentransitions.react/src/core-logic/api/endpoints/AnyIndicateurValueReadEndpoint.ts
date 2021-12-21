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
} from 'core-logic/api/endpoints/AnyIndicateurValueWriteEndpoint';

export interface AnyIndicateurValueGetParams {
  collectiviteId: number;
}

const makeAnyIndicateurValueReadEndpoint = (
  table_name: string,
  writeEndpoint: DataLayerWriteEndpoint<AnyIndicateurValueWrite>
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
  return new AnyIndicateurValueReadEndpoint([writeEndpoint]);
};

export const makeNewIndicateurResultatReadEndpoint = () =>
  makeAnyIndicateurValueReadEndpoint(
    'indicateur_resultat',
    indicateurResultatWriteEndpoint
  );

export const indicateurResultatReadEndpoint =
  makeNewIndicateurResultatReadEndpoint();

export const makeNewIndicateurObjectifReadEndpoint = () =>
  makeAnyIndicateurValueReadEndpoint(
    'indicateur_objectif',
    indicateurObjectifWriteEndpoint
  );

export const indicateurObjectifReadEndpoint =
  makeNewIndicateurObjectifReadEndpoint();
