import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {AllCollectiviteRead} from 'generated/dataLayer';

export const NB_ITEMS_FETCH = 10;

export type TFilters = {search: string};
type TFetchedData = {filteredCollectivites: AllCollectiviteRead[]};

/** Donne la liste des collectivité associée à une recherche textuelle */
export const useFilterCollectivites = (filters: TFilters) => {
  const {data, isLoading} = useQuery(['filter_collectivites', filters], () =>
    fetch(filters)
  );
  return {filteredCollectivites: data?.filteredCollectivites || [], isLoading};
};

/** Charge les données */
const fetch = async (filters: TFilters): Promise<TFetchedData> => {
  const {search} = filters;

  // charge les collectivites
  const query = supabaseClient
    .from<AllCollectiviteRead>('named_collectivite')
    .select()
    .limit(10);

  if (search) {
    query.ilike('nom', `%${search}%`);
  }

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {filteredCollectivites: data || []};
};
