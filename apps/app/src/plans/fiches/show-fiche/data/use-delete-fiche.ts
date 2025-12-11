import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';

type Args = {
  /** Url de redirection à la suppression de la fiche */
  redirectPath?: string;
};

/**
 * Supprime une fiche action d'une collectivité
 */
export const useDeleteFiche = (args: Args) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const router = useRouter();
  const trpc = useTRPC();

  return useMutation(
    trpc.plans.fiches.delete.mutationOptions({
      meta: { disableToast: true },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey({
            collectiviteId,
          }),
        });

        if (args.redirectPath) {
          router.push(args.redirectPath);
        }
      },
    })
  );
};
