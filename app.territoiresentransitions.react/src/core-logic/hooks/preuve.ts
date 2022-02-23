import {useEffect, useState} from 'react';
import {fichierPreuveReadEndpoint} from 'core-logic/api/endpoints/FichierPreuveReadEndpoint';
import {FichierPreuve} from 'generated/dataLayer/fichier_preuve_read';
import {collectiviteBucketReadEndpoint} from 'core-logic/api/endpoints/CollectiviteBucketReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {fichierPreuveWriteEndpoint} from 'core-logic/api/endpoints/FichierPreuveWriteEndpoint';

export type TPreuveFichiersHook = {
  fichiers: FichierPreuve[];
};

export const usePreuveFichiers = (action_id: string): TPreuveFichiersHook => {
  const [fichiers, setFichiers] = useState<FichierPreuve[]>([]);
  const collectivite_id = useCollectiviteId();

  useEffect(() => {
    const fetch = () => {
      if (collectivite_id) {
        fichierPreuveReadEndpoint
          .getBy({collectivite_id, action_id})
          .then(setFichiers);
      }
    };
    fichierPreuveWriteEndpoint.addListener(fetch);
    fetch();
    return () => {
      fichierPreuveWriteEndpoint.removeListener(fetch);
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
