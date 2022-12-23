import {useLocation} from 'react-router-dom';
import {useAuth} from '../core-logic/api/auth/AuthProvider';
import {useEffect} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Database} from 'types/database.types';
import {supabaseClient} from 'core-logic/api/supabase';
import {useLocalisation} from 'core-logic/hooks/useLocalisation';
import {ENV} from 'environmentVariables';

/**
 * Représente la visite d'une page.
 */
type Visite = Database['public']['Tables']['visite']['Insert'];

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
 * Permet d'enregistrer les visites.
 */
export const VisitTracker = () => {
  const {pathname} = useLocation();
  const localisation = useLocalisation();
  const {user} = useAuth();
  const collectivite_id = useCollectiviteId();

  useEffect(() => {
    if (!user) return;
    const visite: Visite = {
      page: localisation.page,
      tag: localisation.tag,
      onglet: localisation.onglet,
      user_id: user.id,
      collectivite_id: collectivite_id,
    };

    if (ENV.node_env === 'development') {
      console.info('\x1B[0;92mtrack visite\x1B[m', pathname, localisation);
      if (localisation.page === 'autre')
        console.error('\x1B[0;92;1mtrack visite\x1B[m', 'Page non reconnue !');
    }

    track(visite);
  }, [pathname]);

  return null;
};

