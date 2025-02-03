import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useQuery } from 'react-query';

/**
 * Charge les effets attendus
 */
export const useEffetsAttendus = () =>
  useQuery(['effets_attendus'], async () => {
    const { data, error } = await supabaseClient.from('effet_attendu').select();

    if (error) throw new Error(error.message);

    return data;
  });
