import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PreuveLienWrite} from 'generated/dataLayer/preuve_lien_write';
import {PostgrestResponse} from '@supabase/supabase-js';

export class PreuveLienWriteEndpoint extends DataLayerWriteEndpoint<PreuveLienWrite> {
  readonly name = 'preuve_lien';

  async _write(
    preuveLien: PreuveLienWrite
  ): Promise<PostgrestResponse<PreuveLienWrite>> {
    return this._table.upsert([preuveLien], {
      //      onConflict: 'collectivite_id,action_id',
    });
  }

  async delete(preuveId: number): Promise<boolean> {
    await this._table.delete().match({id: preuveId});
    this.notifyListeners();
    return false;
  }
}

export const preuveLienWriteEndpoint = new PreuveLienWriteEndpoint();
