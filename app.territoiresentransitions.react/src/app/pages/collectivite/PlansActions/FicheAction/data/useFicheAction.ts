import { ficheActionFetch } from '@/api/plan-actions';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';

export const useFicheAction = (ficheId: string) => {
  const supabase = useSupabase();
  return useQuery(['fiche_action', ficheId], () =>
    ficheActionFetch({
      dbClient: supabase,
      ficheActionId: parseInt(ficheId),
    })
  );
};
