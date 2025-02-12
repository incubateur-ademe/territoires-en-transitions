import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';

/**
 * Charge les effets attendus
 */
export const useEffetsAttendus = () => {
  const supabase = useSupabase();
  return useQuery(['effets_attendus'], async () => {
    const { data, error } = await supabase.from('effet_attendu').select();
    if (error) throw new Error(error.message);

    return data;
  });
};
