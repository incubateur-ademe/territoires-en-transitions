'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useAddDateSaisine = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.demarches.pcaet.addDateSaisine.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.listDossiersInstruction.pathKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.listDatesSaisine.pathKey(),
        });
      },
      meta: {
        success: appLabels.instructionDateSaisineEnregistree,
        error: appLabels.instructionDateSaisineErreur,
      },
    })
  );
};
