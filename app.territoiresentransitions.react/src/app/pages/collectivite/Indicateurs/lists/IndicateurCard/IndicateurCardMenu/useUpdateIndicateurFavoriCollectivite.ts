import { Indicateurs } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useMutation, useQueryClient } from 'react-query';

export const useUpdateIndicateurFavoriCollectivite = (
  collectiviteId: number,
  indicateurId: number
) => {
  const queryClient = useQueryClient();

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
        queryClient.invalidateQueries([
          'indicateur_definitions',
          collectiviteId,
        ]);
        queryClient.invalidateQueries([
          'indicateur_chart_info',
          collectiviteId,
          indicateurId,
        ]);
        queryClient.invalidateQueries([
          'indicateurs_favoris_collectivite',
          collectiviteId,
        ]);
      },
    }
  );
};
