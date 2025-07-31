import { NonNullableFields, Views } from '@/api';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from '@tanstack/react-query';

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
