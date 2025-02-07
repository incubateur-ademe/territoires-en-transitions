import { useQuery } from 'react-query';

import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { TNomCollectivite } from '@/app/types/alias';

export const NB_ITEMS_FETCH = 10;

export type TFilters = { search: string };

/** Donne la liste des collectivité associée à une recherche textuelle */
export const useFilterCollectivites = (filters: TFilters) => {
  const { data, isLoading } = useQuery(['filter_collectivites', filters], () =>
    fetch(filters)
  );
  return {
    filteredCollectivites:
      (data?.filteredCollectivites as TNomCollectivite[]) || [],
    isLoading,
  };
};

/** Charge les données */
const fetch = async (filters: TFilters) => {
  const { search } = filters;

  // charge les collectivites
  const query = supabaseClient.from('named_collectivite').select().limit(10);

  if (search) {
    query.ilike('nom', `%${search}%`);
  }

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return { filteredCollectivites: data || [] };
};
