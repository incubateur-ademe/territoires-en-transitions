import {useEffect, useState} from 'react';
import {FileObject} from '@supabase/storage-js';
import {preuveFichierReadEndpoint} from 'core-logic/api/endpoints/PreuveFichierReadEndpoint';
import {PreuveFichierRead} from 'generated/dataLayer/preuve_fichier_read';
import {collectiviteBucketReadEndpoint} from 'core-logic/api/endpoints/CollectiviteBucketReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {preuveFichierWriteEndpoint} from 'core-logic/api/endpoints/PreuveFichierWriteEndpoint';
import {collectiviteBucketFilesReadEndpoint} from 'core-logic/api/endpoints/CollectiviteBucketFilesReadEndpoint';
import {preuveUploader} from 'ui/shared/actions/AddPreuve/useUploader';

export type TPreuveFichiersHook = {
  fichiers: PreuveFichierRead[];
};

export const usePreuveFichiers = (action_id: string): TPreuveFichiersHook => {
  const [fichiers, setFichiers] = useState<PreuveFichierRead[]>([]);
  const collectivite_id = useCollectiviteId();
  const fetch = () => {
    if (collectivite_id) {
      preuveFichierReadEndpoint
        .getBy({collectivite_id, action_id})
        .then(setFichiers);
    }
  };

  useEffect(() => {
    preuveFichierWriteEndpoint.addListener(fetch);
    fetch();
    return () => {
      preuveFichierWriteEndpoint.removeListener(fetch);
    };
  }, [collectivite_id, action_id]);

  return {fichiers};
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
    preuveUploader.addListener(fetch);
    fetch();
    return () => {
      preuveUploader.removeListener(fetch);
    };
  }, [collectivite_id]);

  return {bucketFiles};
};
