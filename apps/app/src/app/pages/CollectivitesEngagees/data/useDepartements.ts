import { useQuery } from '@tanstack/react-query';
import { NonNullableFields, useSupabase, Views } from '@tet/api';
import { DISABLE_AUTO_REFETCH } from '@tet/api/utils/react-query/query-options';

/**
 * Charge la liste des départements.
 */
export const useDepartements = () => {
  const supabase = useSupabase();

  const { data, isLoading } = useQuery({
    queryKey: ['departement'],

    queryFn: async () => {
      const { data } = await supabase.from('departement').select();
      return data;
    },

    ...DISABLE_AUTO_REFETCH,
  });
  return {
    isLoading,
    departements: (data || []) as TDepartement[],
  };
};

export type TDepartement = NonNullableFields<Views<'departement'>>;
