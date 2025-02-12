import { useQuery } from 'react-query';

import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TNomCollectivite } from '@/app/types/alias';

const NB_ITEMS_FETCH = 10;

type TFilters = { search: string };

/** Donne la liste des collectivité associée à une recherche textuelle */
export const useFilterCollectivites = (filters: TFilters) => {
  const supabase = useSupabase();

  const { data, isLoading } = useQuery(['filter_collectivites', filters], () =>
    fetch(supabase, filters)
  );
  return {
    filteredCollectivites:
      (data?.filteredCollectivites as TNomCollectivite[]) || [],
    isLoading,
  };
};

/** Charge les données */
const fetch = async (supabase: DBClient, filters: TFilters) => {
  const { search } = filters;

  // charge les collectivites
  const query = supabase
    .from('named_collectivite')
    .select()
    .limit(NB_ITEMS_FETCH);

  if (search) {
    query.ilike('nom', `%${search}%`);
  }

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return { filteredCollectivites: data || [] };
};
