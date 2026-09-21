'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';

/**
 * Déclare un indicateur applicable ou non à la collectivité. Le flag vit dans
 * `indicateur_collectivite` et vaut pour tout le produit : la mutation est donc
 * celle du routeur indicateurs, et non une mutation propre au diagnostic.
 *
 * Elle ne renvoie rien — contrairement aux autres mutations du diagnostic, on
 * invalide donc les requêtes au lieu de reposer le payload reçu. `pcaet.get`
 * suit : le badge de complétion du parcours en dépend.
 */
export const useSetIndicateurApplicable = (demarcheId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation(
    trpc.indicateurs.indicateurs.update.mutationOptions({
      meta: { error: appLabels.pcaetDiagnosticApplicabiliteEchec },

      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.diagnostic.get.queryKey({
              collectiviteId,
              demarcheId,
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.get.queryKey({
              collectiviteId,
              demarcheId,
            }),
          }),
        ]);
      },
    })
  );

  const setIndicateurApplicable = useCallback(
    ({
      indicateurId,
      isApplicable,
    }: {
      indicateurId: number;
      isApplicable: boolean;
    }) =>
      mutateAsync({
        indicateurId,
        collectiviteId,
        indicateurFields: { isApplicable },
      }),
    [mutateAsync, collectiviteId]
  );

  return { setIndicateurApplicable, isPending };
};
