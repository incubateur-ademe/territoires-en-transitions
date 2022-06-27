import RealtimeSubscription from '@supabase/realtime-js/dist/module/RealtimeSubscription';
import {clientScoresReadEndpoint} from 'core-logic/api/endpoints/ClientScoresReadEndpoint';
import {ClientScoreBatchRead} from 'core-logic/api/sockets/ScoreSocket';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useEffect, useState} from 'react';
import {useQuery, useQueryClient} from 'react-query';
import {ActionScore} from 'types/ClientScore';
import {Referentiel} from 'types/litterals';

export type ReferentielsActionScores = {eci: ActionScore[]; cae: ActionScore[]};
// Should observe "CollectiviteId" of collectiviteBloc and ActionStatutWriteEndpoint
// so that you start the connection on first status written

const fetchScoresForCollectiviteForReferentiel = async (
  collectiviteId: number,
  referentiel: Referentiel
): Promise<ActionScore[]> => {
  const clientScores = await clientScoresReadEndpoint.getBy({
    collectiviteId,
    referentiel,
  });
  return clientScores[0] ? clientScores[0].scores : [];
};

const fetchScoresForCollectivite = async (
  collectiviteId: number
): Promise<ReferentielsActionScores> => {
  console.log('fetchScoresForCollectivite');
  const eciScores = await fetchScoresForCollectiviteForReferentiel(
    collectiviteId,
    'eci'
  );
  const caeScores = await fetchScoresForCollectiviteForReferentiel(
    collectiviteId,
    'cae'
  );
  return {eci: eciScores, cae: caeScores};
};

export const useScores = (): ReferentielsActionScores => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const [subscription, setSubscription] = useState<RealtimeSubscription | null>(
    null
  );

  if (collectiviteId === null) return {eci: [], cae: []};

  // recharge les données après un changement
  const refetch = () => {
    console.log(
      'useScores refetch after a change in table client_scores ',
      collectiviteId
    );
    queryClient.invalidateQueries(['client_scores', collectiviteId]);
  };

  // souscrit aux changements de client_scores pour cette collectivite
  const subscribe = (collectiviteId: number): RealtimeSubscription =>
    supabaseClient
      .from<ClientScoreBatchRead>(
        `client_scores:collectivite_id=eq.${collectiviteId},referentiel=eq.eci`
      )
      .on('INSERT', refetch)
      // .on('UPDATE', refetch)
      .subscribe();

  // souscrit aux changements de collectivite si ce n'est pas déjà fait
  useEffect(() => {
    console.log('useScores useEffect on collectiviteId ', collectiviteId);
    if (subscription) {
      subscription.unsubscribe();
    }

    if (collectiviteId) {
      const subscribeTo = subscribe(collectiviteId);
      setSubscription(subscribeTo);
      console.log('[UseScores] Successfully subscribed to ', subscribeTo);
    }

    // supprime la souscription quand le composant est démonté
    return () => {
      if (subscription) {
        subscription.unsubscribe();
        setSubscription(null);
      }
    };
  }, [collectiviteId]);

  // charge les données du parcours
  const {data} = useQuery(['client_scores', collectiviteId], () =>
    fetchScoresForCollectivite(collectiviteId)
  );

  return data || {eci: [], cae: []};
};
