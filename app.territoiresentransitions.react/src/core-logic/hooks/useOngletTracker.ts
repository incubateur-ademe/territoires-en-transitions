import {Database} from 'types/database.types';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';
import {useLocalisation} from 'core-logic/hooks/useLocalisation';
import {ENV} from 'environmentVariables';
import {useMemo, useRef} from 'react';

/**
 * Représente la visite d'une page.
 */
type Visite = Database['public']['Tables']['visite']['Insert'];

/**
 * Les différents onglets possibles.
 */
type Onglet = Database['public']['Enums']['visite_onglet'];

/**
 * Enregistre une visite.
 *
 * @param visite
 * @returns success
 */
const track = async (visite: Visite): Promise<boolean> => {
  const {status} = await supabaseClient.from('visite').insert(visite);
  return status === 201;
};

/**
 * Permet de suivre les ouvertures des onglets qui ne sont pas
 * prises en compte par le `VisitTracker` car elles ne changent pas l'URL.
 *
 * @returns la fonction qui permet d'enregistrer la visite de l'onglet
 * en reprenant la collectivite, l'utilisateur courant et la page en cours de visite.
 */
export const useOngletTracker = (): ((onglet: Onglet) => Promise<boolean>) => {
  const collectivite_id = useCollectiviteId();
  const localisation = useLocalisation();
  const ref = useRef();
  const {user} = useAuth();

  const factory = () => {
    // Garde la dernière visite pour éviter d'envoyer
    // une même visite plusieurs fois de suite.
    let tracked: Visite | null;

    return async (onglet: Onglet): Promise<boolean> => {
      if (!user) return false;

      // on ajoute les valeurs courantes à la visite
      const visite: Visite = {
        page: localisation.page,
        tag: localisation.tag,
        onglet: onglet,
        user_id: user.id,
        collectivite_id: collectivite_id,
      };

      // on évite d'envoyer une même visite plusieurs fois de suite
      if (isEqual(tracked, visite)) return false;
      tracked = visite;
      if (ENV.node_env === 'development') {
        console.info('\x1B[0;96mtrack visite\x1B[m', 'visite', visite);
      }

      return track(visite);
    };
  };

  // On renvoie un tracker par ref.
  return useMemo(factory, [ref.current]);
};

const isEqual = (a: Visite | null, b: Visite | null) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.page === b.page &&
    a.tag === b.tag &&
    a.onglet === b.onglet &&
    a.collectivite_id === b.collectivite_id &&
    a.user_id === b.user_id
  );
};
