import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type { IndicateurPeriode } from '@tet/domain/indicateurs';
import { invalidateIndicateurValeursQueries } from './invalidate-indicateur-valeurs-queries';

export const useDeclareIndicateurPeriodes = (
  collectiviteId: number,
  indicateurId: number
) => {
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

  return async (periodes: IndicateurPeriode[]): Promise<void> => {
    await mutateAsync({
      collectiviteId,
      valeurs: periodes.map((period) => ({ indicateurId, period })),
    });
  };
};
