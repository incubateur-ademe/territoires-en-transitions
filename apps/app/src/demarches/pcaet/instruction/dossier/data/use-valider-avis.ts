'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useValiderAvis = (demandeAvisId: number) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.demarches.pcaet.validerAvis.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.getDossierInstruction.queryKey({
            demandeAvisId,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.listDemandesAvis.pathKey(),
        });
      },
      meta: {
        success: appLabels.instructionFinaliserAvisValide,
        error: appLabels.instructionFinaliserErreur,
      },
    })
  );
};
