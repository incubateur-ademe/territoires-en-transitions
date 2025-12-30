import { makeCollectiviteTousLesIndicateursUrl } from '@/app/app/paths';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Event, useEventTracker } from '@tet/ui';
import { useRouter } from 'next/navigation';

export const useDeleteIndicateurDefinition = (indicateurId: number) => {
  const tracker = useEventTracker();
  const queryClient = useQueryClient();
  const router = useRouter();
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const mutationOptions = trpc.indicateurs.indicateurs.delete.mutationOptions();

  return useMutation({
    mutationKey: mutationOptions.mutationKey,
    mutationFn: async () => {
      return mutationOptions.mutationFn?.({
        indicateurId,
        collectiviteId,
      });
    },
    meta: {
      success: "L'indicateur personnalisé a été supprimé",
      error: "L'indicateur personnalisé n'a pas pu être supprimé",
    },
    onSuccess: () => {
      tracker(Event.indicateurs.deleteIndicateur, {
        indicateurId,
      });

      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.indicateurs.list.queryKey({
          collectiviteId,
        }),
      });

      router.push(
        makeCollectiviteTousLesIndicateursUrl({
          collectiviteId,
        })
      );
    },
  });
};
