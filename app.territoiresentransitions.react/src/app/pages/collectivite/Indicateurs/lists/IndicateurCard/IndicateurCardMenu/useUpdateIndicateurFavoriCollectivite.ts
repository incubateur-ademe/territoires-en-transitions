import {Indicateurs} from '@tet/api';
import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

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
      },
    }
  );
};
