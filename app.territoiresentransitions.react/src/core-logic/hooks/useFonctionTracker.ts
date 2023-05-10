import {Database} from 'types/database.types';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';
import {useLocalisation} from 'core-logic/hooks/useLocalisation';
import {ENV} from 'environmentVariables';
import {useMemo, useRef} from 'react';

/**
 * Représente l'utilisation d'une fonctionnalité
 */
type Usage = Database['public']['Tables']['usage']['Insert'];

/**
 * Enregistre un usage.
 *
 * @param usage
 * @returns success
 */
const track = async (usage: Usage): Promise<boolean> => {
  const {status} = await supabaseClient.from('usage').insert(usage);
  return status === 201;
};

/**
 * Permet de suivre les usages des fonctionnalités.
 *
 * @returns la fonction qui permet d'enregistrer l'usage
 * en reprenant la collectivite, l'utilisateur courant
 * et la page en cours de visite.
 */
export const useFonctionTracker = (): ((usage: Usage) => Promise<boolean>) => {
  const collectivite_id = useCollectiviteId();
  const localisation = useLocalisation();
  const ref = useRef();
  const {user} = useAuth();

  const factory = () => {
    // Garde la dernière valeur d'usage pour éviter d'envoyer
    // un même usage plusieurs fois de suite.
    let tracked: Usage | null;

    const tracker = async (usage: Usage): Promise<boolean> => {
      // on ajoute les valeurs courantes à l'usage
      if (collectivite_id) usage['collectivite_id'] = collectivite_id;
      if (user) usage['user_id'] = user.id;
      usage.page = localisation.page;

      // on évite d'envoyer un même usage plusieurs fois de suite
      if (isEqual(tracked, usage)) return false;
      tracked = usage;
      if (ENV.node_env === 'development') {
        console.info('\x1B[0;96mtrack usage\x1B[m', 'usage', usage);
      }

      return track(usage);
    };

    return tracker;
  };

  // On renvoie un tracker par ref.
  return useMemo(factory, [ref.current]);
};

const isEqual = (a: Usage | null, b: Usage | null) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.page === b.page &&
    a.action === b.action &&
    a.fonction === b.fonction &&
    a.collectivite_id === b.collectivite_id &&
    a.user_id === b.user_id
  );
};
