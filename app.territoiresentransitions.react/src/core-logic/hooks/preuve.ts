import {useEffect, useState} from 'react';
import {FileObject} from '@supabase/storage-js';
import {preuveReadEndpoint} from 'core-logic/api/endpoints/PreuveReadEndpoint';
import {PreuveRead} from 'generated/dataLayer/preuve_read';
import {collectiviteBucketReadEndpoint} from 'core-logic/api/endpoints/CollectiviteBucketReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {preuveFichierWriteEndpoint} from 'core-logic/api/endpoints/PreuveFichierWriteEndpoint';
import {preuveLienWriteEndpoint} from 'core-logic/api/endpoints/PreuveLienWriteEndpoint';
import {collectiviteBucketFilesReadEndpoint} from 'core-logic/api/endpoints/CollectiviteBucketFilesReadEndpoint';
//import {preuveUploader} from 'ui/shared/ResourceManager/useUploader';

export const usePreuves = (action_id: string): PreuveRead[] => {
  const [preuves, setPreuves] = useState<PreuveRead[]>([]);
  const collectivite_id = useCollectiviteId();
  const fetch = () => {
    if (collectivite_id) {
      preuveReadEndpoint.getBy({collectivite_id, action_id}).then(setPreuves);
    }
  };

  useEffect(() => {
    preuveFichierWriteEndpoint.addListener(fetch);
    preuveLienWriteEndpoint.addListener(fetch);
    fetch();
    return () => {
      preuveFichierWriteEndpoint.removeListener(fetch);
      preuveLienWriteEndpoint.removeListener(fetch);
    };
  }, [collectivite_id, action_id]);

  return preuves;
};

export const useCollectiviteBucketId = () => {
  const collectivite_id = useCollectiviteId();
  const [bucketId, setBucketId] = useState<string>('');

  useEffect(() => {
    if (collectivite_id) {
      collectiviteBucketReadEndpoint.getBy({collectivite_id}).then(data => {
        const {bucket_id} = data?.[0];
        setBucketId(bucket_id);
      });
    }
  });

  return bucketId;
};

export type TCollectiviteFichiersHook = {
  bucketFiles: FileObject[];
};

export const useCollectiviteBucketFiles = (): TCollectiviteFichiersHook => {
  const [bucketFiles, setBucketFiles] = useState<FileObject[]>([]);
  const collectivite_id = useCollectiviteId()!;
  const fetch = () => {
    if (collectivite_id) {
      collectiviteBucketFilesReadEndpoint
        .getBy({collectivite_id})
        .then(bucketFiles => setBucketFiles(bucketFiles));
    }
  };

  useEffect(() => {
    // preuveUploader.addListener(fetch);
    fetch();
    return () => {
      // preuveUploader.removeListener(fetch);
    };
  }, [collectivite_id]);

  return {bucketFiles};
};
