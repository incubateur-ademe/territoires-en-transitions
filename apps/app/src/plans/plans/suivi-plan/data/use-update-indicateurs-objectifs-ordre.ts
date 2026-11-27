import { appLabels } from '@/app/labels/catalog';
import { useTRPC } from '@tet/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type IndicateurOrdonne = { id: number };

/** Place les indicateurs dans l'ordre donné ; ceux qui n'y figurent pas suivent. */
const reordonner = <T extends IndicateurOrdonne>(
  indicateurs: T[] | undefined,
  indicateurIds: number[]
) => {
  if (!indicateurs) {
    return indicateurs;
  }
  const rang = new Map(indicateurIds.map((id, index) => [id, index]));
  const rangDe = (indicateur: T, index: number) =>
    rang.get(indicateur.id) ?? indicateurIds.length + index;
  return indicateurs
    .map((indicateur, index) => ({
      indicateur,
      rang: rangDe(indicateur, index),
    }))
    .sort((a, b) => a.rang - b.rang)
    .map(({ indicateur }) => indicateur);
};

export const useUpdateIndicateursObjectifsOrdre = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const queryKey = trpc.plans.suivi.getIndicateursObjectifs.queryKey();

  return useMutation(
    trpc.plans.suivi.updateIndicateursObjectifsOrdre.mutationOptions({
      onMutate: async ({ indicateurIds }) => {
        await queryClient.cancelQueries({ queryKey });
        queryClient.setQueriesData<IndicateurOrdonne[]>(
          { queryKey },
          (indicateurs) => reordonner(indicateurs, indicateurIds)
        );
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey }),
      meta: { error: appLabels.indicateursObjectifsOrdreErreur },
    })
  );
};
