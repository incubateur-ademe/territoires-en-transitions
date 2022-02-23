import {useEffect, useState} from 'react';
import {preuveReadEndpoint} from 'core-logic/api/endpoints/PreuveReadEndpoint';
import {FichierPreuve} from 'generated/dataLayer/preuve_read';
import {collectiviteBucketReadEndpoint} from 'core-logic/api/endpoints/CollectiviteBucketReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {preuveWriteEndpoint} from 'core-logic/api/endpoints/PreuveWriteEndpoint';
import {collectiviteBucketFilesReadEndpoint} from 'core-logic/api/endpoints/CollectiviteBucketFilesReadEndpoint';
import {preuveUploader} from 'ui/shared/actions/AddPreuve/useUploader';
// eslint-disable-next-line node/no-extraneous-import
import {FileObject} from '@supabase/storage-js';

export type TPreuveFichiersHook = {
  fichiers: FichierPreuve[];
};

export const usePreuveFichiers = (action_id: string): TPreuveFichiersHook => {
  const [fichiers, setFichiers] = useState<FichierPreuve[]>([]);
  const collectivite_id = useCollectiviteId();
  const fetch = () => {
    if (collectivite_id) {
      preuveReadEndpoint.getBy({collectivite_id, action_id}).then(setFichiers);
    }
  };

  useEffect(() => {
    preuveWriteEndpoint.addListener(fetch);
    fetch();
    return () => {
      preuveWriteEndpoint.removeListener(fetch);
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
    console.log('=> => collectiviteBucketFilesReadEndpoint should fetch !! ');
    if (collectivite_id) {
      collectiviteBucketFilesReadEndpoint
        .getBy({collectivite_id})
        .then(bucketFiles => setBucketFiles(bucketFiles));
      console.log('bucketFiles ', bucketFiles);
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
