import { NonNullableFields, Views } from '@/api';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from '@tanstack/react-query';

/**
 * Charge la liste des régions.
 */
export const useRegions = () => {
  const supabase = useSupabase();

  const { data, isLoading } = useQuery({
    queryKey: ['region'],

    queryFn: async () => {
      const { data } = await supabase.from('region').select();
      return data;
    },

    ...DISABLE_AUTO_REFETCH,
  });
  return {
    isLoading,
    regions: (data || []) as TRegion[],
  };
};

export type TRegion = NonNullableFields<Views<'region'>>;
