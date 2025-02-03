import { ficheActionFetch } from '@/api/plan-actions';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useQuery } from 'react-query';

export const useFicheAction = (ficheId: string) => {
  return useQuery(['fiche_action', ficheId], () =>
    ficheActionFetch({
      dbClient: supabaseClient,
      ficheActionId: parseInt(ficheId),
    })
  );
};
