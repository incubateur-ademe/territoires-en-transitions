'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

export const useSetDemarchePcaetPublication = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.demarches.pcaet.setPublicationStatus.mutationOptions({
      onSuccess: async (updated) => {
        queryClient.setQueryData(
          trpc.demarches.pcaet.get.queryKey({
            collectiviteId,
            demarcheId: updated.id,
          }),
          updated
        );
        await queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.list.queryKey({ collectiviteId }),
        });
      },
    })
  );
};
