import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useRouter } from 'next/navigation';

/** Démarrer un audit */
export const useStartAudit = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation(
    trpc.referentiels.labellisations.startAudit.mutationOptions({
      onSuccess: (audit) => {
        const { collectiviteId, referentielId } = audit;

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
            collectiviteId,
            referentielId,
          }),
        });

        // TODO: find a more optimize way to update the user context
        // Tried with setUser from userContext but it didn't work
        router.refresh();
      },
    })
  );
};
