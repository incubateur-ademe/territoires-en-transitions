import { Indicateurs } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from 'react-query';

export const useUpdateIndicateurFavoriCollectivite = (
  collectiviteId: number,
  indicateurId: number
) => {
  const queryClient = useQueryClient();
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
        utils.indicateurs.definitions.list.invalidate({
          collectiviteId,
          indicateurIds: [indicateurId],
        });

        queryClient.invalidateQueries([
          'indicateurs_favoris_collectivite',
          collectiviteId,
        ]);
      },
    }
  );
};
