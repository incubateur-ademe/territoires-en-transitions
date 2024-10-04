import { FicheAction, ficheActionFetch } from '@tet/api/plan-actions';
import { supabaseClient } from 'core-logic/api/supabase';
import { useQuery } from 'react-query';

type TFetchedData = {
  fiche: FicheAction;
};

// const fetchFicheAction = async (ficheId: string): Promise<TFetchedData> => {
//   const query = supabaseClient
//     .from('fiche_action')
//     .select()
//     .eq('id', ficheId)
//     .single();

//   const { error, data } = await query;
//   if (error) {
//     throw new Error(error.message);
//   }

//   return { fiche: objectToCamel(data) as FicheAction };
// };

export const useFicheAction = (ficheId: string) => {
  const { data, refetch, isLoading } = useQuery(['fiche_action', ficheId], () =>
    ficheActionFetch({
      dbClient: supabaseClient,
      ficheActionId: parseInt(ficheId),
    })
  );

  return { data, refetch, isLoading };
};
