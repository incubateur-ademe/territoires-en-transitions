'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useValiderPartieInstruction = (demandeAvisId: number) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.demarches.pcaet.validerPartieInstruction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.getDossierInstruction.queryKey({
            demandeAvisId,
          }),
        });
      },
      meta: {
        success: appLabels.instructionDossierValidationEnregistree,
        error: appLabels.instructionDossierValidationErreur,
      },
    })
  );
};
