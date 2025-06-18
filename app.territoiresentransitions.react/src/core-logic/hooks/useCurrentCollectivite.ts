import {
  fetchCollectiviteNiveauAcces,
  useCollectiviteId,
} from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';


// charge la collectivité courante (à partir de son id)
// et détermine si elle est en lecture seule pour l'utilisateur courant ou non
// la requête est rechargée quand le user id ou le collectivite id changent
/**
 * @deprecated: use hook from collectivite-context.tsx instead
 */
export const useCurrentCollectivite = () => {
  const user = useUser();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  const { data } = useQuery(
    ['current_collectivite', collectiviteId, user?.id],
    async () => {
      const collectivite = collectiviteId
        ? await fetchCollectiviteNiveauAcces(supabase, collectiviteId)
        : user?.collectivites?.length
        ? user.collectivites[0]
        : null;

      if (!collectivite) {
        return null;
      }

      return (collectivite);
    }
  );

  return data || null;
};
