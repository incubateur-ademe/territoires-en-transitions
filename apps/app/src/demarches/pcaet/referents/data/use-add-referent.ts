'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useAddReferent = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.demarches.pcaet.referents.add.mutationOptions({
      meta: { success: appLabels.referentsPcaetAjoutSucces },
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.referents.listOrganismes.queryKey(),
        }),
    })
  );
};
