'use client';

import { RouterOutput, useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Options communes aux six opérations de transition : toutes renvoient la
 * démarche à jour, donc toutes rafraîchissent le cache de la même façon. Les
 * classeurs proposés au téléchargement suivent : la transmission et la
 * publication en figent de nouveaux.
 *
 * Les mutations elles-mêmes s'appellent directement là où elles servent
 * (`trpc.demarches.pcaet.publier`…) : il n'y a rien à mutualiser de plus.
 */
export const useDemarchePcaetTransitionOptions = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMemo(
    () => ({
      onSuccess: async (updated: RouterOutput['demarches']['pcaet']['get']) => {
        queryClient.setQueryData(
          trpc.demarches.pcaet.get.queryKey({
            collectiviteId,
            demarcheId: updated.id,
          }),
          updated
        );
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.list.queryKey({ collectiviteId }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.exports.list.queryKey(),
          }),
        ]);
      },
    }),
    [collectiviteId, queryClient, trpc]
  );
};
