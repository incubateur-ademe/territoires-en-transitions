import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface LabellisationDemandeGetParams {
  collectivite_id: number;
  etoiles: string;
  referentiel: string;
}

class LabellisationDemandeReadEndpoint extends DataLayerReadCachedEndpoint<
  LabellisationDemandeRead,
  LabellisationDemandeGetParams
> {
  readonly name = 'labellisation_demande';

  async _read(
    getParams: LabellisationDemandeGetParams
  ): Promise<PostgrestResponse<LabellisationDemandeRead>> {
    return this._table
      .eq('collectivite_id', getParams.collectivite_id)
      .eq('etoiles', getParams.etoiles)
      .eq('referentiel', getParams.referentiel);
  }
}

export const labellisationDemandeReadEndpoint =
  new LabellisationDemandeReadEndpoint([]);
