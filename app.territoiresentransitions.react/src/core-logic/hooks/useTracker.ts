import {Database} from 'types/database.types';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';

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
 * en reprenant la collectivite et l'utilisateur courant.
 */
export const useTracker = (): (usage: Usage) => Promise<boolean> => {
  const collectivite_id = useCollectiviteId();
  const {user} = useAuth();

  const tracker = (usage: Usage) => {
    if (collectivite_id)
      usage['collectivite_id'] = collectivite_id;
    if (user)
      usage['user_id'] = user.id;

    return track(usage);
  };

  return tracker;
};
