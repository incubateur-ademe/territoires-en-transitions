import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {LabellisationRead} from 'generated/dataLayer/labellisation_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface LabellisationGetParams {
  collectivite_id: number;
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
      .order('obtenue_le', {ascending: false})
      .limit(1);
  }
}

export const labellisationReadEndpoint = new LabellisationReadEndpoint([]);
