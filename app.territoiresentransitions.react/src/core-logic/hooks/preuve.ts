import {useEffect, useState} from 'react';
import {
  FichierPreuve,
  fichierPreuveReadEndpoint,
} from 'core-logic/api/endpoints/FichierPreuveReadEndpoint';
import {collectiviteBucketReadEndpoint} from 'core-logic/api/endpoints/CollectiviteBucketReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  upsertFichierPreuve,
  FichierPreuveWrite,
} from 'core-logic/api/procedures/preuveProcedures';

export type TPreuveFichiersHook = {
  fichiers: FichierPreuve[];
  upsertPreuve: (fichierPreuve: FichierPreuveWrite) => Promise<boolean>;
};

export const usePreuveFichiers = (action_id: string): TPreuveFichiersHook => {
  const [fichiers, setFichiers] = useState<FichierPreuve[]>([]);
  const collectivite_id = useCollectiviteId();

  /*
  const [subscription, setSubscription] = useState<RealtimeSubscription>();
  useEffect(() => {
    if (!subscription) {
      const sub = supabaseClient
        .from(`preuve:collectivite_id=eq.${collectivite_id}`)
        .on('INSERT', fetch)
        .on('UPDATE', fetch)
        .subscribe();
      setSubscription(sub);
      return () => {
        supabaseClient.removeSubscription(sub);
      };
    }
    return () => {};
  }, [subscription, collectivite_id, action_id]);
  */

  useEffect(() => {
    fetch();
  }, [collectivite_id, action_id]);

  const fetch = () => {
    console.log('refetch');
    if (collectivite_id) {
      fichierPreuveReadEndpoint({collectivite_id, action_id})
        //.getBy({collectivite_id, action_id})
        .then(setFichiers);
    }
  };

  const upsertPreuve = (fichierPreuve: FichierPreuveWrite): Promise<boolean> =>
    upsertFichierPreuve(fichierPreuve).then(ret => {
      if (ret) {
        fetch();
      }
      return ret;
    });

  return {fichiers, upsertPreuve};
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
