import { NonNullableFields, Views } from '@/api';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useQuery } from 'react-query';

/**
 * Charge la liste des régions.
 */
export const useRegions = () => {
  const { data, isLoading } = useQuery(
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
  const { data } = await supabaseClient.from('region').select();
  return data;
};

export type TRegion = NonNullableFields<Views<'region'>>;
