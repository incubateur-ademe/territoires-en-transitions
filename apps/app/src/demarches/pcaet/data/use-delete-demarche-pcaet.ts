'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

export const useDeleteDemarchePcaet = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.demarches.pcaet.delete.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.list.queryKey({ collectiviteId }),
          }),
          // Les EPCI que couvrait le dépôt supprimé redeviennent cochables.
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.getDepotContext.pathKey(),
          }),
        ]);
      },
    })
  );
};
