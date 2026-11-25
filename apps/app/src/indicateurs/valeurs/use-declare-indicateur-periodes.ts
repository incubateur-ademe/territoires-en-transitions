import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTRPC } from '@tet/api';
import type { IndicateurPeriode } from '@tet/domain/indicateurs';
import { invalidateIndicateurValeursQueries } from './invalidate-indicateur-valeurs-queries';

export type DeclareIndicateursPeriodes = (
  indicateurIds: readonly number[],
  periodes: IndicateurPeriode[]
) => Promise<void>;

export const useDeclareIndicateursPeriodes = (
  collectiviteId: number
): DeclareIndicateursPeriodes => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation(
    trpc.indicateurs.valeurs.upsertMany.mutationOptions({
      meta: {
        success: appLabels.indicateurColonnesAjoutees,
        error: appLabels.indicateurColonnesAjouteesErreur,
      },
      onSuccess: () =>
        invalidateIndicateurValeursQueries({
          queryClient,
          trpc,
          collectiviteId,
        }),
    })
  );

  return useCallback(
    async (indicateurIds, periodes): Promise<void> => {
      await mutateAsync({
        collectiviteId,
        valeurs: indicateurIds.flatMap((indicateurId) =>
          periodes.map((period) => ({ indicateurId, period }))
        ),
      });
    },
    [mutateAsync, collectiviteId]
  );
};

export const useDeclareIndicateurPeriodes = (
  collectiviteId: number,
  indicateurId: number
) => {
  const declareIndicateursPeriodes =
    useDeclareIndicateursPeriodes(collectiviteId);

  return useCallback(
    (periodes: IndicateurPeriode[]): Promise<void> =>
      declareIndicateursPeriodes([indicateurId], periodes),
    [declareIndicateursPeriodes, indicateurId]
  );
};
