import { Indicateurs } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from 'react-query';

export const useUpdateIndicateurFavoriCollectivite = (
  collectiviteId: number,
  indicateurId: number
) => {
  const utils = trpc.useUtils();

  const queryClient = useQueryClient();

  const trpcUtils = trpc.useUtils();

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
        utils.indicateurs.definitions.getFavorisCount.invalidate({
          collectiviteId,
        });
        queryClient.invalidateQueries(['indicateur_favori', indicateurId]);
        trpcUtils.indicateurs.list.invalidate({ collectiviteId });
      },
    }
  );
};
