import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useRouter } from 'next/navigation';

export const useSwitchToTe = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.switchToTe.mutationOptions({
      onSuccess: async () => {
        // les prefs vivent dans le contexte user/collectivité (SSR), pas dans React Query
        router.refresh();

        // données référentiel migrées (statuts, scores, snapshots…)
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey:
              trpc.referentiels.actions.listActionsGroupedById.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.referentiels.snapshots.getCurrent.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.referentiels.snapshots.list.pathKey(),
          }),
        ]);
      },
    })
  );
};
