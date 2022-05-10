import {useEffect, useState} from 'react';
import {RealtimeSubscription} from '@supabase/realtime-js';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {labellisationParcoursReadEndpoint} from 'core-logic/api/endpoints/LabellisationParcoursReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {supabaseClient} from 'core-logic/api/supabase';
import {labellisationDemandeWriteEndpoint} from 'core-logic/api/endpoints/LabellisationDemandeWriteEndpoint';
import {LabellisationDemandeWrite} from 'generated/dataLayer/labellisation_demande_write';
import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {labellisationDemandeReadEndpoint} from 'core-logic/api/endpoints/LabellisationDemandeReadEndpoint';

/** Renvoie les données de labellisation de la collectivité courante */
export const useParcoursLabellisation = (
  referentiel: string | null
): {
  parcours: LabellisationParcoursRead | null;
  demande: LabellisationDemandeRead | null;
} => {
  const collectivite_id = useCollectiviteId();
  const [parcours, setParcours] = useState<LabellisationParcoursRead | null>(
    null
  );
  const [demande, setDemande] = useState<LabellisationDemandeRead | null>(null);
  const [subscription, setSubscription] = useState<RealtimeSubscription | null>(
    null
  );

  // crée la demande
  const createDemande = async (
    p: LabellisationParcoursRead
  ): Promise<LabellisationDemandeWrite | null> => {
    if (collectivite_id) {
      const {referentiel, etoiles} = p;
      return labellisationDemandeWriteEndpoint.save({
        collectivite_id,
        etoiles,
        referentiel,
      });
    }
    return Promise.resolve(null);
  };

  // charge les données de la demande
  const fetchDemande = async (p: LabellisationParcoursRead) => {
    if (collectivite_id && p) {
      const {referentiel, etoiles} = p;
      // charge les demandes
      const demandes = await labellisationDemandeReadEndpoint.getBy({
        collectivite_id,
        etoiles,
        referentiel,
      });

      if (!demandes?.length) {
        // crée la demande si elle n'existe pas
        const demande = await createDemande(p);
        if (demande) {
          setDemande(demande as LabellisationDemandeRead);
        }
      } else {
        setDemande(demandes[0]);
      }
    }
  };

  // charge les données du parcours
  const fetch = async () => {
    if (collectivite_id) {
      const parcoursList = await labellisationParcoursReadEndpoint.getBy({
        collectivite_id,
      });

      // trouve le parcours pour le référentiel
      const p =
        parcoursList?.find(parcours => parcours.referentiel === referentiel) ||
        null;

      if (p) {
        const {criteres_action} = p;
        setParcours({
          ...p,
          // trie les critères action
          criteres_action: criteres_action.sort((a, b) => a.prio - b.prio),
        });
        fetchDemande(p);
      } else {
        setParcours(null);
      }
    }
  };
  useEffect(() => {
    fetch();
  }, [collectivite_id, referentiel]);

  // recharge les données après un changement de statut d'une action
  const refetch = (payload: {new: {collectivite_id: number}}) => {
    if (collectivite_id && payload?.new?.collectivite_id === collectivite_id) {
      // si on recharge trop vite lors du changement de statut, il semblerait que la
      // RPC appelée par labellisationParcoursReadEndpoint ne soit pas à jour (?)
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

  // recharge les données quand la demande est mise à jour lors de l'envoi
  useEffect(() => {
    labellisationDemandeWriteEndpoint.addListener(fetch);
    return () => {
      labellisationDemandeWriteEndpoint.removeListener(fetch);
    };
  }, []);

  // renvoie le parcours correspondant au référentiel courant
  return {parcours, demande};
};
