import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';
import {NonNullableFields} from 'types/utils';

/**
 * Charge la liste des départements.
 */
export const useDepartements = () => {
  const {data, isLoading} = useQuery(
    ['departement'],
    () => fetch(),
    DISABLE_AUTO_REFETCH
  );
  return {
    isLoading,
    departements: (data || []) as TDepartement[],
  };
};

const fetch = async () => {
  const {data} = await supabaseClient.from('departement').select();
  return data;
};

export type TDepartement = NonNullableFields<
  Database['public']['Views']['departement']['Row']
>;
