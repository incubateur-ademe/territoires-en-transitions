import { Indicateurs } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation } from 'react-query';

export const useUpdateIndicateurFavoriCollectivite = (
  collectiviteId: number,
  indicateurId: number
) => {
  const utils = trpc.useUtils();

  return useMutation(
    ['update_indicateur_favori_collectivite', indicateurId],
    async (isFavori: boolean) =>
      Indicateurs.save.updateIndicateurFavoriCollectivite(
        supabaseClient,
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
