import {useEffect, useState} from 'react';
import {useQuery, useQueryClient} from 'react-query';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {supabaseClient} from 'core-logic/api/supabase';
import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {fetchParcours, getReferentielParcours} from './queries';
import {useDemandeLabellisation} from './useDemandeLabellisation';
import {ReferentielParamOption} from 'app/paths';
import {RealtimeChannel} from '@supabase/supabase-js';

type SubToRef = {
  ref: string;
  sub: RealtimeChannel;
};

/** Renvoie les données de labellisation de la collectivité courante */
export const useParcoursLabellisation = (
  referentiel: string | null
): {
  parcours: LabellisationParcoursRead | null;
  demande: LabellisationDemandeRead | null;
} => {
  const collectivite_id = useCollectiviteId();
  const [subscription, setSubscription] = useState<SubToRef | null>(null);
  const queryClient = useQueryClient();

  // charge les données du parcours
  const {data: parcoursList} = useQuery(
    ['labellisation_parcours', collectivite_id],
    () => fetchParcours(collectivite_id)
  );
  const parcours = getReferentielParcours(parcoursList, referentiel);
  const {etoiles} = parcours || {};

  // charge les données de la demande
  const demande = useDemandeLabellisation(
    referentiel as ReferentielParamOption,
    etoiles
  );

  // recharge les données après un changement de statut d'une action
  const refetch = () => {
    queryClient.invalidateQueries(['labellisation_parcours', collectivite_id]);
  };

  // souscrit aux changements de statuts dans un référentiel
  const subscribe = (ref: string) => {
    const subscribeTo = `public:action_statut:collectivite_id=eq.${collectivite_id}`;
    const sub = supabaseClient
      .channel(subscribeTo)
      .on(
        'postgres_changes',
        {event: 'INSERT', schema: 'public', table: 'action_statut'},
        refetch
      )
      .on(
        'postgres_changes',
        {event: 'UPDATE', schema: 'public', table: 'action_statut'},
        refetch
      )
      .subscribe();
    setSubscription({sub, ref});
  };

  // souscrit aux changements de statuts si ce n'est pas déjà fait
  useEffect(() => {
    if (collectivite_id && referentiel) {
      if (subscription && subscription.ref !== referentiel) {
        subscription.sub.unsubscribe();
      }
      subscribe(referentiel);
    }

    // supprime la souscription quand le composant est démonté
    return () => {
      if (subscription) {
        subscription.sub.unsubscribe();
        setSubscription(null);
      }
    };
  }, [collectivite_id, referentiel]);

  // renvoie le parcours correspondant au référentiel courant
  return {parcours: parcours || null, demande: demande || null};
};
