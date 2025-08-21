import { useSupabase } from '@/api/utils/supabase/use-supabase';
import useSWR from 'swr';

export const useIsVerified = () => {
  const supabase = useSupabase();

  const { data: isVerified = false } = useSWR('est_verifie', async () => {
    const { data, error } = await supabase.rpc('est_verifie');
    if (error) throw error;
    return data ?? false;
  });

  return isVerified;
};
