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
      // Pas de message de succès : la modale enchaîne sur son accusé de
      // réception, un toast par-dessus dirait deux fois la même chose. Le
      // subscriber n'en affiche donc aucun — il ne parle qu'en cas d'erreur.
      meta: { error: appLabels.instructionFinaliserErreur },
    })
  );
};
