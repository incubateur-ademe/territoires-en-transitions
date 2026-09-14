import { useSupabase } from '@tet/api';
import useSWR from 'swr';

type Collectivite = {
  collectivite_id: number;
  nom: string;
  engagee?: boolean;
  active?: boolean;
};

/** Donne des infos sur une collectivité */
export const useCollectiviteInfo = (collectiviteId: number | null) => {
  const key = `collectivite-info-${collectiviteId}`;
  const supabase = useSupabase();

  return useSWR(key, async () => {
    if (!collectiviteId) return null;

    const { error, data } = await supabase
      .from('site_labellisation')
      .select('collectivite_id, nom, engagee, active')
      .eq('collectivite_id', collectiviteId)
      .returns<Collectivite[]>();

    if (error) {
      throw new Error(error.message);
    }
    if (!data || !data.length) {
      return null;
    }

    return data[0];
  });
};
