import { NonNullableFields, Views } from '@/api';
import {
  DISABLE_AUTO_REFETCH,
  supabaseClient,
} from '@/app/core-logic/api/supabase';
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
