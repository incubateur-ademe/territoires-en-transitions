import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';
import { useUpdateIndicateur } from '../../indicateurs/use-update-indicateur';
import { invalidateIndicateurValeursQueries } from '../../valeurs/invalidate-indicateur-valeurs-queries';

export type UpdateSousIndicateursCumul = (isCumul: boolean) => void;

export const useUpdateSousIndicateursCumul = (
  indicateurId: number
): UpdateSousIndicateursCumul => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate } = useUpdateIndicateur(indicateurId);

  return useCallback(
    (isCumul) =>
      mutate(
        { totalEstCumulDesSousIndicateurs: isCumul },
        {
          onSuccess: () =>
            invalidateIndicateurValeursQueries({
              queryClient,
              trpc,
              collectiviteId,
            }),
        }
      ),
    [mutate, queryClient, trpc, collectiviteId]
  );
};
