import { FicheAction, ficheActionFetch } from '@tet/api/plan-actions';
import { supabaseClient } from 'core-logic/api/supabase';
import { useQuery } from 'react-query';

// type TFetchedData = {
//   fiche: FicheAction;
// };

export const useFicheAction = (ficheId: string) => {
  return useQuery(['fiche_action', ficheId], () =>
    ficheActionFetch({
      dbClient: supabaseClient,
      ficheActionId: parseInt(ficheId),
    })
  );

  // console.log(data);

  // return { data, refetch, isLoading };
};
