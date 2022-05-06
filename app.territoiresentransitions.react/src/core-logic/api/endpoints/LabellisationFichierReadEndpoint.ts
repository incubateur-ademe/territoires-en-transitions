import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {labellisationFichierWriteEndpoint} from 'core-logic/api/endpoints/LabellisationFichierWriteEndpoint';
import {
  LabellisationPreuveFichierRead,
  LabellisationPreuveFichierReadParams,
} from 'generated/dataLayer/labellisation_preuve_fichier_read';

class LabellisationFichierReadEndpoint extends DataLayerReadCachedEndpoint<
  LabellisationPreuveFichierRead,
  LabellisationPreuveFichierReadParams
> {
  readonly name = 'action_labellisation_preuve_fichier';

  async _read(
    getParams: LabellisationPreuveFichierReadParams
  ): Promise<PostgrestResponse<LabellisationPreuveFichierRead>> {
    return this._table
      .eq('collectivite_id', getParams.collectivite_id)
      .eq('demande_id', getParams.demande_id);
  }
}

export const labellisationFichierReadEndpoint =
  new LabellisationFichierReadEndpoint([labellisationFichierWriteEndpoint]);
