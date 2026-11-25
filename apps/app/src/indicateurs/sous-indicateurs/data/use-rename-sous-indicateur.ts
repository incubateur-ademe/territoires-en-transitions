import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';

export type RenameSousIndicateur = (
  input: Readonly<{ indicateurId: number; titre: string }>
) => void;

export const useRenameSousIndicateur = (): RenameSousIndicateur => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate } = useMutation(
    trpc.indicateurs.indicateurs.update.mutationOptions({
      meta: { error: appLabels.indicateurSousIndicateurRenommeErreur },
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.indicateurs.list.pathKey(),
        }),
    })
  );

  return useCallback(
    ({ indicateurId, titre }) =>
      mutate({ indicateurId, collectiviteId, indicateurFields: { titre } }),
    [mutate, collectiviteId]
  );
};
