import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { makeCollectiviteTousLesIndicateursUrl } from '@/app/app/paths';
import { Event, useEventTracker } from '@/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useDeleteIndicateurDefinition = (indicateurId: number) => {
  const tracker = useEventTracker();
  const queryClient = useQueryClient();
  const router = useRouter();
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const mutationOptions = trpc.indicateurs.definitions.delete.mutationOptions();

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
        queryKey: trpc.indicateurs.definitions.list.queryKey({
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
