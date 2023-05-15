import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';
import {NonNullableFields} from 'types/utils';

/**
 * Charge la liste des régions.
 */
export const useRegions = () => {
  const {data, isLoading} = useQuery(
    ['region'],
    () => fetch(),
    DISABLE_AUTO_REFETCH
  );
  return {
    isLoading,
    regions: (data || []) as TRegion[],
  };
};

const fetch = async () => {
  const {data} = await supabaseClient.from('region').select();
  return data;
};

export type TRegion = NonNullableFields<
  Database['public']['Views']['region']['Row']
>;
