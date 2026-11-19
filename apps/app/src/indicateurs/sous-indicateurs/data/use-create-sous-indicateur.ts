import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';
import { invalidateIndicateurValeursQueries } from '../../valeurs/invalidate-indicateur-valeurs-queries';

export type CreateSousIndicateur = (
  input: Readonly<{ parentId: number; titre: string }>,
  options?: Readonly<{ onCreated: (indicateurId: number) => void }>
) => void;

export const useCreateSousIndicateur = (): CreateSousIndicateur => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate } = useMutation(
    trpc.indicateurs.indicateurs.create.mutationOptions({
      meta: {
        success: appLabels.indicateurSousIndicateurCree,
        error: appLabels.indicateurSousIndicateurCreeErreur,
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
    ({ parentId, titre }, options) =>
      mutate(
        { collectiviteId, parentId, titre },
        { onSuccess: (indicateurId) => options?.onCreated(indicateurId) }
      ),
    [mutate, collectiviteId]
  );
};
