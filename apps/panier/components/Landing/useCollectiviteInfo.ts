import { useSupabase } from '@/api';
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

    const { error: errorUserCollectivites, data: userCollectivites } =
      await supabase
        .from('mes_collectivites')
        .select('collectivite_id')
        .eq('collectivite_id', collectiviteId);
    if (errorUserCollectivites) {
      throw new Error(errorUserCollectivites.message);
    }

    const isOwnCollectivite = !!userCollectivites?.find(
      (c) => c.collectivite_id === collectiviteId
    );

    return { ...data[0], isOwnCollectivite };
  });
};
