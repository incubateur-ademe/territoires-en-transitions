import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {fichierPreuveWriteEndpoint} from 'core-logic/api/endpoints/FichierPreuveWriteEndpoint';

export interface FichierPreuveParams {
  collectivite_id: number;
  action_id: string;
}

export interface FichierPreuve {
  collectivite_id: number;
  bucket_id: string;
  action_id: string;
  filename: string;
  path: string;
  commentaire: string;
}

class FichierPreuveReadEndpoint extends DataLayerReadCachedEndpoint<
  FichierPreuve,
  FichierPreuveParams
> {
  readonly name = 'fichier_preuve';

  async _read(
    getParams: FichierPreuveParams
  ): Promise<PostgrestResponse<FichierPreuve>> {
    return this._table
      .eq('collectivite_id', getParams.collectivite_id)
      .eq('action_id', getParams.action_id);
  }
}

export const fichierPreuveReadEndpoint = new FichierPreuveReadEndpoint([
  fichierPreuveWriteEndpoint,
]);

// export const fichierPreuveReadEndpoint = async ({
//   collectivite_id,
//   action_id,
// }: FichierPreuveParams): Promise<FichierPreuve[]> => {
//   const {data, error} = await supabaseClient
//     .from('fichier_preuve')
//     .select()
//     .eq('collectivite_id', collectivite_id)
//     .eq('action_id', action_id);

//   if (error) {
//     throw error.message;
//   }
//   return data as FichierPreuve[];
// };
