'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useRemoveReferent = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.demarches.pcaet.referents.remove.mutationOptions({
      meta: { success: appLabels.referentsPcaetRetraitSucces },
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.referents.listOrganismes.queryKey(),
        }),
    })
  );
};
