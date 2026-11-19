import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { invalidateIndicateurValeursQueries } from '../../valeurs/invalidate-indicateur-valeurs-queries';

export type DetachSousIndicateur = (indicateurId: number) => void;

export const useDetachSousIndicateur = (): DetachSousIndicateur => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate } = useMutation(
    trpc.indicateurs.indicateurs.detach.mutationOptions({
      meta: {
        success: appLabels.indicateurSousIndicateurDissocie,
        error: appLabels.indicateurSousIndicateurDissocieErreur,
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.indicateurs.list.pathKey(),
          }),
          invalidateIndicateurValeursQueries({
            queryClient,
            trpc,
            collectiviteId,
          }),
        ]);
      },
    })
  );

  return useCallback(
    (indicateurId) => mutate({ indicateurId, collectiviteId }),
    [mutate, collectiviteId]
  );
};
