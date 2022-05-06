import {PostgrestResponse} from '@supabase/supabase-js';
import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import type {LabellisationDemandeWrite} from 'generated/dataLayer/labellisation_demande_write';

export class LabellisationDemandeWriteEndpoint extends DataLayerWriteEndpoint<LabellisationDemandeWrite> {
  readonly name = 'labellisation_demande';

  async _write(
    demande: LabellisationDemandeWrite
  ): Promise<PostgrestResponse<LabellisationDemandeWrite>> {
    return this._table.upsert([demande]);
  }
}

export const labellisationDemandeWriteEndpoint =
  new LabellisationDemandeWriteEndpoint();
