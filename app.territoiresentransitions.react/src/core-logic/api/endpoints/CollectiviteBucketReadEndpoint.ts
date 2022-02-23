import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface CollectiviteBucketParams {
  collectivite_id: number;
}

export interface CollectiviteBucket {
  collectivite_id: number;
  bucket_id: string;
}

class CollectiviteBucketReadEndpoint extends DataLayerReadCachedEndpoint<
  CollectiviteBucket,
  CollectiviteBucketParams
> {
  readonly name = 'collectivite_bucket';

  async _read(
    getParams: CollectiviteBucketParams
  ): Promise<PostgrestResponse<CollectiviteBucket>> {
    return this._table.eq('collectivite_id', getParams.collectivite_id);
  }
}

export const collectiviteBucketReadEndpoint =
  new CollectiviteBucketReadEndpoint([]);
