import { FicheAction, ficheActionFetch } from '@tet/api/plan-actions';
import { supabaseClient } from 'core-logic/api/supabase';
import { useQuery } from 'react-query';

type TFetchedData = {
  fiche: FicheAction;
};

export const useFicheAction = (ficheId: string) => {
  const { data, refetch, isLoading } = useQuery(['fiche_action', ficheId], () =>
    ficheActionFetch({
      dbClient: supabaseClient,
      ficheActionId: parseInt(ficheId),
    })
  );

  return { data, refetch, isLoading };
};
