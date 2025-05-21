import { useCollectiviteId } from '@/api/collectivites';
import {
  planActionsFetch,
  WithSelect,
} from '@/api/plan-actions/plan-actions.list/data-access/plan-actions.fetch';
import { FetchOptions } from '@/api/plan-actions/plan-actions.list/domain/fetch-options.schema';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from '@tanstack/react-query';

type Props = {
  options?: FetchOptions;
  withSelect?: WithSelect[];
};

/**
 * Récupère uniquement les axes racines des plans d'action.
 *
 * Pour ajouter les axes enfants il faut donner `withSelect: ['axes']` en paramètre.
 */
export const usePlansActionsListe = ({ options, withSelect }: Props) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['plans_actions', collectiviteId, options, withSelect],
    queryFn: () =>
      planActionsFetch({
        dbClient: supabase,
        collectiviteId,
        options,
        withSelect,
      }),
  });
};
