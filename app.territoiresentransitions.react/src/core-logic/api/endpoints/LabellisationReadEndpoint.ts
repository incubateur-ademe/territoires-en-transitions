import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {LabellisationRead} from 'generated/dataLayer/labellisation_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface LabellisationGetParams {
  collectivite_id: number;
  referentiel: string;
}

export class LabellisationReadEndpoint extends DataLayerReadCachedEndpoint<
  LabellisationRead,
  LabellisationGetParams
> {
  readonly name = 'labellisation';

  async _read(
    getParams: LabellisationGetParams
  ): Promise<PostgrestResponse<LabellisationRead>> {
    return this._table
      .eq('collectivite_id', getParams.collectivite_id)
      .eq('referentiel', getParams.referentiel)
      .order('obtenue_le', {ascending: false});
  }
}

export const labellisationReadEndpoint = new LabellisationReadEndpoint([]);
