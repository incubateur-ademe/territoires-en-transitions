// import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
// eslint-disable-next-line node/no-extraneous-import
import {FileObject} from '@supabase/storage-js';

export interface CollectiviteBucketFilesParams {
  bucket_id: string;
}

/*
class CollectiviteBucketFilesReadEndpoint extends DataLayerReadCachedEndpoint<
  Array<FileObject> | null,
  CollectiviteBucketFilesParams
> {
  readonly name = 'storage.objects'; // ???

  async _read(
    getParams: CollectiviteBucketFilesParams
  ): Promise<Array<FileObject> | null> {
    const {data, error} = await supabaseClient.storage
      .from(getParams.bucket_id)
      .list();
    if (error) throw error?.message;
    return data;
  }
}
*/

// TODO: utiliser le cache ?
export const collectiviteBucketFilesReadEndpoint = async ({
  bucket_id,
}: CollectiviteBucketFilesParams): Promise<Array<FileObject> | null> => {
  const {data, error} = await supabaseClient.storage.from(bucket_id).list();
  if (error) throw error?.message;
  return data;
};
