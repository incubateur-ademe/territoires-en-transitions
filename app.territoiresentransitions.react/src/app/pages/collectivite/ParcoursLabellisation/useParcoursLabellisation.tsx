import {useEffect, useState} from 'react';
import {RealtimeSubscription} from '@supabase/realtime-js';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {labellisationParcoursReadEndpoint} from 'core-logic/api/endpoints/LabellisationParcoursReadEndpoint';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {supabaseClient} from 'core-logic/api/supabase';

/** Renvoie les données de labellisation de la collectivité courante */
export const useParcoursLabellisation =
  (): LabellisationParcoursRead | null => {
    const collectivite_id = useCollectiviteId();
    const referentiel = useReferentielId();
    const [data, setData] = useState<LabellisationParcoursRead | null>(null);
    const [subscription, setSubscription] =
      useState<RealtimeSubscription | null>(null);

    // charge les données
    const fetch = async () => {
      if (collectivite_id) {
        const parcours = await labellisationParcoursReadEndpoint.getBy({
          collectivite_id,
        });

        setData(
          parcours?.find(parcours => parcours.referentiel === referentiel) ||
            null
        );
      }
    };
    useEffect(() => {
      fetch();
    }, [collectivite_id]);

    // recharge les données après un changement de statuts
    const refetch = (payload: {new: {collectivite_id: number}}) => {
      console.log(payload);
      if (
        collectivite_id &&
        payload?.new?.collectivite_id === collectivite_id
      ) {
        // si on recharge trop vite lors d'un changement de statut il semblerait que la
        // RPC appelée par labellisationParcoursReadEndpoint ne soit pas à jour
        // alors on ajoute un delai avec de recharger
        setTimeout(() => fetch(), 300);
      }
    };

    // souscrit aux changements de statuts si ce n'est pas déjà fait
    useEffect(() => {
      if (!subscription && collectivite_id && referentiel) {
        const subscribeTo = `action_statut:collectivite_id=eq.${collectivite_id}`;
        const sub = supabaseClient
          .from(subscribeTo)
          .on('INSERT', refetch)
          .on('UPDATE', refetch)
          .subscribe();
        setSubscription(sub);
      }

      // supprime la souscription quand le composant est démonté
      return () => {
        subscription?.unsubscribe();
        setSubscription(null);
      };
    }, [collectivite_id, referentiel]);

    // renvoie le parcours correspondant au référentiel courant
    return data;
  };
