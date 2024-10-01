import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';

/**
 * Charge les effets attendus
 */
export const useEffetsAttendus = () =>
  useQuery(['effets_attendus'], async () => {
    const {data, error} = await supabaseClient.from('effet_attendu').select();

    if (error) throw new Error(error.message);

    return data;
  });
