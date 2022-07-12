import {RealtimeSubscription} from '@supabase/realtime-js';
import {ClientScoreBatchRead} from 'core-logic/api/sockets/ScoreSocket';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useEffect, useState} from 'react';
import {useQuery, useQueryClient} from 'react-query';
import {Referentiel} from 'types/litterals';

export type TMembreFonction =
  | 'referent'
  | 'conseiller'
  | 'technique'
  | 'politique'
  | 'partenaire';

export type TNiveauAcces = 'admin' | 'edition' | 'lecture';

export const niveauAccesLabels: Record<TNiveauAcces, string> = {
  admin: 'Admin',
  edition: 'Édition',
  lecture: 'Lecture',
};

export interface Membre {
  email: string;
  nom: string;
  prenom: string;
  user_id: string;
  telephone?: string;
  fonction?: TMembreFonction;
  champ_intervention?: Referentiel[];
  details_fonction?: string;
  niveau_acces: TNiveauAcces;
}

export type TUpdateMembreField<T extends any> = (
  membreId: string,
  membreField: T
) => void;

const fetchMembresForCollectivite = async (
  collectiviteId: number
): Promise<Membre[]> => {
  const {data, error} = await supabaseClient
    .rpc('collectivite_membres', {
      id: collectiviteId,
    })
    .select();

  if (error) {
    return [];
  }
  return (data as unknown as Membre[]) || null;
};

export const useCollectiviteMembres = (): Membre[] => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const [subscriptions, setSubscriptions] = useState<
    RealtimeSubscription[] | null
  >(null);

  if (collectiviteId === null) return [];

  // recharge les données après un changement
  const refetch = () => {
    console.log('will refetch collectivite_membres');
    queryClient.invalidateQueries(['collectivite_membres', collectiviteId]);
  };

  // souscrit aux changements des droits d'acces pour cette collectivite
  const subscribeToDroit = (collectiviteId: number): RealtimeSubscription =>
    supabaseClient
      .from(`private_utilisateur_droit:collectivite_id=eq.${collectiviteId}`)
      .on('INSERT', refetch)
      .on('UPDATE', refetch)
      .subscribe();

  // souscrit aux changements des membres pour cette collectivite
  const subscribeToMembre = (collectiviteId: number): RealtimeSubscription =>
    supabaseClient
      .from(`private_collectivite_membre:collectivite_id=eq.${collectiviteId}`)
      .on('INSERT', refetch)
      .on('UPDATE', refetch)
      .subscribe();

  useEffect(() => {
    // souscrit aux changements de collectivite si ce n'est pas déjà fait
    if (collectiviteId) {
      console.log('subscribe to droit and membre');
      const subscriptiontoDroit = subscribeToDroit(collectiviteId);
      const subscritionToMembre = subscribeToMembre(collectiviteId);
      setSubscriptions([subscriptiontoDroit, subscritionToMembre]);
    }

    // supprime la souscription quand le composant est démonté
    return () => {
      if (subscriptions !== null) {
        console.log('supprime la souscription quand le composant est démonté');
        subscriptions[0].unsubscribe();
        subscriptions[1].unsubscribe();
        setSubscriptions(null);
      }
    };
  }, [collectiviteId]);

  // charge les données du parcours
  const {data} = useQuery(['collectivite_membres', collectiviteId], () =>
    fetchMembresForCollectivite(collectiviteId)
  );

  return data || [];
};

export const updateMembreFonction = async (
  collectiviteId: number,
  membreUserId: string,
  fonction: TMembreFonction
) => {
  const {data, error} = await supabaseClient
    .rpc('update_collectivite_membre_fonction', {
      collectivite_id: collectiviteId,
      membre_id: membreUserId,
      fonction,
    })
    .select();

  console.log('[RPC] update_collectivite_membre_fonction ', error, data);
};

export const updateMembreDetailsFonction = async (
  collectiviteId: number,
  membreUserId: string,
  detailsFonction: string
) => {
  const {data, error} = await supabaseClient
    .rpc('update_collectivite_membre_details_fonction', {
      collectivite_id: collectiviteId,
      membre_id: membreUserId,
      details_fonction: detailsFonction,
    })
    .select();

  console.log(
    '[RPC] update_collectivite_membre_details_fonction ',
    error,
    data
  );
};

export const updateMembreChampIntervention = async (
  collectiviteId: number,
  membreUserId: string,
  champIntervention: Referentiel[]
) => {
  const {data, error} = await supabaseClient
    .rpc('update_collectivite_membre_champ_intervention', {
      collectivite_id: collectiviteId,
      membre_id: membreUserId,
      champ_intervention: champIntervention,
    })
    .select();

  console.log(
    '[RPC] update_collectivite_membre_champ_intervention ',
    error,
    data
  );
};
