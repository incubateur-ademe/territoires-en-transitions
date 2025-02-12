import { Indicateurs } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation } from 'react-query';

export const useUpdateIndicateurFavoriCollectivite = (
  collectiviteId: number,
  indicateurId: number
) => {
  const utils = trpc.useUtils();
  const supabase = useSupabase();

  return useMutation(
    ['update_indicateur_favori_collectivite', indicateurId],
    async (isFavori: boolean) =>
      Indicateurs.save.updateIndicateurFavoriCollectivite(
        supabase,
        indicateurId,
        collectiviteId,
        isFavori
      ),
    {
      onSuccess: () => {
        utils.indicateurs.list.invalidate({
          collectiviteId,
        });
        utils.indicateurs.definitions.list.invalidate({
          collectiviteId,
        });
        utils.indicateurs.definitions.list.invalidate({
          collectiviteId,
          indicateurIds: [indicateurId],
        });
        utils.indicateurs.definitions.getFavorisCount.invalidate({
          collectiviteId,
        });
      },
    }
  );
};
