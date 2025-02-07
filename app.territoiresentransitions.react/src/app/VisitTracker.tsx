import { TablesInsert } from '@/api';
import { ENV } from '@/api/environmentVariables';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useLocalisation } from '@/app/core-logic/hooks/useLocalisation';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '../users/user-provider';

/**
 * Représente la visite d'une page.
 */
type Visite = TablesInsert<'visite'>;

/**
 * Enregistre une visite.
 *
 * @param visite
 * @returns success
 */
const track = async (visite: Visite): Promise<boolean> => {
  const { status } = await supabaseClient.from('visite').insert(visite);
  return status === 201;
};

/**
 * Permet d'enregistrer les visites.
 */
export const VisitTracker = () => {
  const pathname = usePathname();
  const localisation = useLocalisation();
  const user = useUser();
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
