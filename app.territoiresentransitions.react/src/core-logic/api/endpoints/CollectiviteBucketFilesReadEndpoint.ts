import {FileObject} from '@supabase/storage-js';
import {supabaseClient} from 'core-logic/api/supabase';
import {collectiviteBucketReadEndpoint} from './CollectiviteBucketReadEndpoint';

export interface CollectiviteBucketFilesParams {
  collectivite_id: number;
}

// liste tous les fichiers de la bibliothèque d'une collectivité
class CollectiviteBucketFilesReadEndpoint {
  async getBy(getParams: CollectiviteBucketFilesParams): Promise<FileObject[]> {
    const buckets = await collectiviteBucketReadEndpoint.getBy({
      collectivite_id: getParams.collectivite_id,
    });

    const bucket_id = buckets[0]?.bucket_id;

    if (!bucket_id) return [];

    const {data, error} = await supabaseClient.storage.from(bucket_id).list();
    if (error) throw error?.message;
    return data || [];
  }
}

export const collectiviteBucketFilesReadEndpoint =
  new CollectiviteBucketFilesReadEndpoint();
