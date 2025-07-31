import { Indicateurs } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateIndicateurFavoriCollectivite = (
  collectiviteId: number,
  indicateurId: number
) => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    mutationKey: ['update_indicateur_favori_collectivite', indicateurId],

    mutationFn: async (isFavori: boolean) =>
      Indicateurs.save.updateIndicateurFavoriCollectivite(
        supabase,
        indicateurId,
        collectiviteId,
        isFavori
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.list.queryKey({
          collectiviteId,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.definitions.list.queryKey({
          collectiviteId,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.definitions.list.queryKey({
          collectiviteId,
          indicateurIds: [indicateurId],
        }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.definitions.getFavorisCount.queryKey({
          collectiviteId,
        }),
      });
    },
  });
};
