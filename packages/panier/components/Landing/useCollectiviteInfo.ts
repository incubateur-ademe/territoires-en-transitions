import {makeSearchString} from '@tet/api';
import {supabase} from 'src/clientAPI';
import useSWR from 'swr';

/** Donne des infos sur une collectivité */
export const useCollectiviteInfo = (collectiviteId: number | null) => {
  const key = `collectivite-info-${collectiviteId}`;
  return useSWR(key, async () => {
    if (!collectiviteId) return null;

    const {error, data} = await supabase
      .from('site_labellisation')
      .select('collectivite_id, nom, engagee')
      .eq('collectivite_id', collectiviteId);

    if (error) {
      throw new Error(key);
    }
    if (!data || !data.length) {
      return null;
    }

    return data[0];
  });
};
